"""Dev-only in-memory matchmaking queue consumer.

This consumer keeps a module-level queue (collections.deque). When a client
sends {"action": "join"} it is enqueued; when another client joins the
consumer will match them and send both a `matched` event with a generated
game id. This is only suitable for single-process local development.
"""

import json
import uuid
from collections import deque

from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import Game

from datetime import date
import chess.pgn
import io

DEFAULT_PGN_TEMPLATE = """
[Event "Casual Game"]
[Date "{date}"]
[Site "?"]
[Round "?"]
[White "{whitePlayer}"]
[Black "{blackPlayer}"]
[Result "*"]
 *"""


# We'll just use a simple in-memory queue since this isn't a production grade project
# and realistically only 1 person should be in it at a time.
_queue: tuple[str, str] = deque()

class RoomInfo:
    def __init__(self, game: chess.pgn.Game):
        self.clients = 0
        self.game = game
        self.board = game.board()
        for move in game.mainline_moves():
            self.board.push(move)

_rooms: dict[str, RoomInfo] = {}

class PlayQueueConsumer(WebsocketConsumer):

    def connect(self):
        self.accept()

    def disconnect(self, close_code):
        # remove from queue if present
        for item in list(_queue):
            if item[0] == self.channel_name:
                _queue.remove(item)
                break

    def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except Exception:
            self.send(text_data=json.dumps({"error": "invalid json"}))
            return

        action = data.get("action")
        user = data.get("user")
        if not user:
            self.send(text_data=json.dumps({"error": "missing user"}))
            return
        self.user = user

        if action == "join":
            # prevent duplicate entries
            if any(item[0] == self.channel_name for item in _queue):
                self.send(text_data=json.dumps({"event": "queued"}))
                return

            # if no one is waiting, enqueue
            if len(_queue) == 0:
                _queue.append((self.channel_name, user))
                self.send(text_data=json.dumps({"event": "queued"}))
                return

            # otherwise match with the oldest queued player
            opponent_channel, opponent_user = _queue.popleft()
            game_id = str(uuid.uuid4())
            Game.objects.create(id=game_id, pgn=DEFAULT_PGN_TEMPLATE.format(
                date=date.today().strftime("%Y.%m.%d"),
                whitePlayer=self.user,
                blackPlayer=opponent_user,
            ))
            

            # notify opponent
            async_to_sync(self.channel_layer.send)(
                opponent_channel,
                {
                    "type": "queue.matched",
                    "text": json.dumps({"event": "matched", "game": game_id, "role": "black"}),
                },
            )

            # notify self
            self.send(text_data=json.dumps({"event": "matched", "game": game_id, "role": "white"}))

        elif action == "leave":
            for item in list(_queue):
                if item[0] == self.channel_name:
                    _queue.remove(item)
                    self.send(text_data=json.dumps({"event": "left"}))
                    break

        else:
            print("Echoing back message:", data)

    def queue_matched(self, event):
        text = event.get("text")
        if text is not None:
            self.send(text_data=text)

class PlayGameConsumer(WebsocketConsumer):
    def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'game_{self.game_id}'

        if not Game.objects.filter(id=self.game_id).exists():
            self.close(reason="invalid game id")
            return
        if self.game_id not in _rooms:
            print("Creating new play room and loading game from DB:", self.game_id)
            gameFromDB = Game.objects.get(id=self.game_id)
            game = chess.pgn.read_game(io.StringIO(gameFromDB.pgn))
            # if the game is over, we don't want to accept the connection
            res = game.headers.get("Result")
            if res != "*":
                self.close(reason="game is over")
                return
            # Go to most recent position in game
            while game.variations:
                game = game.variations[-1]
            _rooms[self.game_id] = RoomInfo(game)

        _rooms[self.game_id].clients += 1

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

        # Send current game pgn to the new client
        pgn = _rooms[self.game_id].game.game().__str__()
        self.send(text_data=json.dumps({"event": "send_pgn", "pgn": pgn}))


    def disconnect(self, close_code):
        if self.game_id not in _rooms:
            return
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        _rooms[self.game_id].clients -= 1
        if _rooms[self.game_id].clients <= 0:
            # get canonical state and persist to DB
            print("Removing play room and writing game to DB:", self.game_id)
            oldRoomInfo = _rooms.pop(self.game_id)
            pgn = oldRoomInfo.game.game().__str__()
            game = Game.objects.get(id=self.game_id)
            game.pgn = pgn
            game.save()
    
    def receive(self, text_data):
        # Send message to room group
        try:
            data = json.loads(text_data)
        except Exception:
            self.send(text_data=json.dumps({"error": "invalid json"}))
            return
        
        action = data.get("action")
        if action == "move":
            # Get the user and check to make sure it's their turn
            # (This is not secure, just a basic check to avoid obvious issues)
            user = data.get("user")
            if not user:
                self.send(text_data=json.dumps({"error": "missing user"}))
                return
            board = _rooms[self.game_id].board
            if (board.turn == chess.WHITE and user != _rooms[self.game_id].game.game().headers["White"]) or \
               (board.turn == chess.BLACK and user != _rooms[self.game_id].game.game().headers["Black"]):
                self.send(text_data=json.dumps({"error": "not your turn"}))
                return
            move_uci = data.get("move")
            if not move_uci:
                self.send(text_data=json.dumps({"error": "missing move"}))
                return
            board = _rooms[self.game_id].board
            try:
                move = chess.Move.from_uci(move_uci)
                if move not in board.legal_moves:
                    self.send(text_data=json.dumps({"error": "illegal move"}))
                    return
                _rooms[self.game_id].game = _rooms[self.game_id].game.add_variation(move)
                board.push(move)
            except Exception:
                self.send(text_data=json.dumps({"error": "move validation failed"}))
                return
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'game.message',
                    'text': json.dumps({"event": "move", "move": move_uci}),
                    'sender': self.channel_name,
                }
            )
            return
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'game.message',
                'text': text_data,
                'sender': self.channel_name,
            }
        )

    def game_message(self, event):
        # Don't echo messages back to the origin sender
        sender = event.get('sender')
        if sender == self.channel_name:
            return
        text = event.get('text')
        if text is not None:
            self.send(text_data=text)