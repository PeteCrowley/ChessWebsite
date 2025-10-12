import React, { useState, useEffect, useRef, useCallback } from 'react';
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
	const { sendJsonMessage, lastJsonMessage } = useWebSocket(WS_URL, {
		shouldReconnect: () => true,
	});

	const chessGameRef = useRef(new ReactiveChess());

	const [playerColor, setPlayerColor] = useState<Color | null>(null);
	const [isPlayersTurn, setIsPlayersTurn] = useState(false);
	const [isGameOver, setIsGameOver] = useState(() => chessGameRef.current.isGameOver());
	const [mostRecentPly, setMostRecentPly] = useState<number>(
		() => chessGameRef.current.history().length
	);
	const [drawOfferActive, setDrawOfferActive] = useState<boolean>(false);

	const navigate = useNavigate();

	// function to make a move on the chess game, and update state accordingly
	const makeMove = useCallback(
		(move: { from: string; to: string; promotion?: string } | string) => {
			const cg = chessGameRef.current;
			cg.move(move);
			if (drawOfferActive) setDrawOfferActive(false);
			setMostRecentPly(cg.history().length);
			if (cg.isGameOver()) {
				cg.setHeader('Result', cg.isDraw() ? '1/2-1/2' : cg.turn() === 'w' ? '0-1' : '1-0');
				setIsGameOver(true);
				setIsPlayersTurn(false);
			}
			setIsPlayersTurn(cg.turn() === playerColor);
		},
		[chessGameRef, playerColor, drawOfferActive]
	);

	useEffect(() => {
		if (!lastJsonMessage || typeof lastJsonMessage !== 'object') return;
		const ev = (lastJsonMessage as any).event;
		if (ev === 'move') {
			const moveUci = (lastJsonMessage as any).move;
			try {
				makeMove(moveUci);
				setMostRecentPly(chessGameRef.current.history().length);
			} catch (e) {
				console.error('Failed to make move from opponent:', e);
			}
		}
		if (ev === 'send_pgn') {
			const pgn = (lastJsonMessage as any).pgn;
			chessGameRef.current.loadPgn(pgn);
			setMostRecentPly(chessGameRef.current.history().length);
			if (username === chessGameRef.current.getHeaders()['White']) {
				setPlayerColor('w');
				setIsPlayersTurn(chessGameRef.current.turn() === 'w');
			} else if (username === chessGameRef.current.getHeaders()['Black']) {
				setPlayerColor('b');
				setIsPlayersTurn(chessGameRef.current.turn() === 'b');
			}
		}
		if (ev === 'game_over') {
			chessGameRef.current.loadPgn((lastJsonMessage as any).pgn);
			setMostRecentPly(chessGameRef.current.history().length);
			setIsGameOver(true);
			setIsPlayersTurn(false);
			navigate(`/game/${gameId}`);
		}
		if (ev === 'draw_offered') {
			setDrawOfferActive(true);
		}
	}, [lastJsonMessage, username, navigate, gameId, makeMove]);

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
		[makeMove, sendJsonMessage]
	);

	return (
		<div>
			<GameViewer
				chessGame={chessGameRef.current}
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
