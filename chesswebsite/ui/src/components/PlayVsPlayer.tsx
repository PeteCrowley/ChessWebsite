import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import ReactiveChess from './ReactiveChess';
import { Color } from 'chess.js';
import GameViewer from './GameViewer';
import { useParams, useNavigate } from 'react-router-dom';
import useWebSocket from 'react-use-websocket';
import { useAuth } from './AuthContext';
import { buildWsUrl } from '../lib/api';

export default function PlayVsPlayer() {
	const auth = useAuth();
	const username = auth.user?.username ?? 'anonymous';

	const { gameId } = useParams();
	const WS_URL = buildWsUrl(`/ws/play/${gameId}/`);
	const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
		shouldReconnect: () => true,
	});

	const chessGameRef = useRef(new ReactiveChess());
	const chessGame = chessGameRef.current;

	const [playerColor, setPlayerColor] = useState<Color | null>(null);
	const [isPlayersTurn, setIsPlayersTurn] = useState(false);
	const [isGameOver, setIsGameOver] = useState(chessGame.isGameOver());
	const [mostRecentPly, setMostRecentPly] = useState<number>(chessGame.history().length);
	const [drawOfferActive, setDrawOfferActive] = useState<boolean>(false);

	const navigate = useNavigate();

	useEffect(() => {
		if (!lastJsonMessage || typeof lastJsonMessage !== 'object') return;
		const ev = (lastJsonMessage as any).event;
		if (ev === 'move') {
			const moveUci = (lastJsonMessage as any).move;
			try {
				makeMove(moveUci);
				setMostRecentPly(chessGame.history().length);
			} catch (e) {
				console.error('Failed to make move from opponent:', e);
			}
		}
		if (ev === 'send_pgn') {
			const pgn = (lastJsonMessage as any).pgn;
			chessGame.loadPgn(pgn);
			setMostRecentPly(chessGame.history().length);
			if (username === chessGame.getHeaders()['White']) {
				setPlayerColor('w');
				setIsPlayersTurn(chessGame.turn() === 'w');
			} else if (username === chessGame.getHeaders()['Black']) {
				setPlayerColor('b');
				setIsPlayersTurn(chessGame.turn() === 'b');
			}
		}
		if (ev === 'game_over') {
			chessGame.loadPgn((lastJsonMessage as any).pgn);
			setMostRecentPly(chessGame.history().length);
			setIsGameOver(true);
			setIsPlayersTurn(false);
			navigate(`/game/${gameId}`);
		}
		if (ev === 'draw_offered') {
			setDrawOfferActive(true);
		}
	}, [lastJsonMessage, username, chessGame]);

	// function to make a move on the chess game, and update state accordingly
	const makeMove = (move: { from: string; to: string; promotion?: string } | string) => {
		chessGame.move(move);
		if (drawOfferActive) setDrawOfferActive(false);
		setMostRecentPly(chessGame.history().length);
		if (chessGame.isGameOver()) {
			chessGame.setHeader(
				'Result',
				chessGame.isDraw() ? '1/2-1/2' : chessGame.turn() === 'w' ? '0-1' : '1-0'
			);
			setIsGameOver(true);
			setIsPlayersTurn(false);
		}
		setIsPlayersTurn(chessGame.turn() === playerColor);
	};

	// handle when the player tries to make a move
	const handleMoveRequest = useCallback(
		(move: { from: string; to: string; promotion?: string }): boolean => {
			if (move.from === 'resign' && move.to === 'resign') {
				sendJsonMessage({ action: 'resign' });
				return true;
			}
			if (move.from === 'offer_draw' && move.to === 'offer_draw') {
				sendJsonMessage({ action: 'offer_draw' });
				return true;
			}
			try {
				makeMove(move);
				const uciMove = move.from + move.to + (move.promotion ?? '');
				sendJsonMessage({ action: 'move', move: uciMove });
				return true;
			} catch (e: any) {
				if (e instanceof Error && e.message === 'Invalid move') {
					return false;
				}
			}
			return false;
		},
		[chessGame, playerColor, username]
	);

	return (
		<div>
			<GameViewer
				chessGame={chessGame}
				gameTitle={`Player vs Player`}
				onMoveRequest={handleMoveRequest}
				pieceDraggingEnabled={isPlayersTurn && !isGameOver}
				boardOrientation={playerColor === 'w' ? 'white' : 'black'}
				currentPly={mostRecentPly}
				isGameActive={!isGameOver}
				drawOfferActive={drawOfferActive}
			/>
		</div>
	);
}
