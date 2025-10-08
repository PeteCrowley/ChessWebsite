from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
from rest_framework import generics
from .models import Game
from .serializers import CreateGameSerializer, FetchGameSerializer
from chess import engine, Board

# Create your views here
def index(request):
    return HttpResponse("Hello this is the main page")

class GameListView(generics.ListAPIView):
    queryset = Game.objects.all()
    serializer_class = FetchGameSerializer

class GameAddView(generics.CreateAPIView):
    queryset = Game.objects.all()
    serializer_class = CreateGameSerializer

class GameDetailView(generics.RetrieveAPIView):
    """Retrieve a single Game by its UUID `id` field."""
    queryset = Game.objects.all()
    serializer_class = FetchGameSerializer
    lookup_field = "id"

@api_view(['POST'])
def get_engine_move(request) -> str:
    """Given a FEN string, return the engine's best move."""
    fen = request.data.get("fen")
    if not fen:
        return JsonResponse({
            "status": "error",
            "error": "missing_fen",
            "message": "FEN string is required",
            }, status=400)
    board = Board(fen)
    if not board.is_valid():
        return JsonResponse({
            "status": "error",
            "error": "invalid_fen",
            "message": "Invalid FEN string",
            }, status=400)
    
    if "limit" in request.data:
        time_limit = request.data.get("limit")
    else:
        time_limit = 0.1  # default time limit
    
    eg = engine.SimpleEngine.popen_uci("api/stockfish/stockfish-macos-m1-apple-silicon")
    result = eg.play(board, engine.Limit(time_limit))
    eg.quit()

    if not result.move:
        return JsonResponse({
            "status": "error",
            "error": "no_move",
            "message": "Engine could not find a move",
            }, status=500)
    
    move = result.move.uci()
    print("Engine suggests move:", move)
    return JsonResponse({
        "status": "ok",
        "move": move,
    }, status=200)