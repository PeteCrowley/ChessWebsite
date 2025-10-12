import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactiveChess from './ReactiveChess';
import { Color } from 'chess.js';
import GameViewer from './GameViewer';
import apiFetch from '../lib/api';

export default function PlayVsEngine() {
	const chessGameRef = useRef(new ReactiveChess());
	const chessGame = chessGameRef.current;

	const [playerColor, setPlayerColor] = useState<Color | null>(null);
	const [hasChosenColor, setHasChosenColor] = useState<boolean>(false);
	const [isPlayersTurn, setIsPlayersTurn] = useState(true);
	const [isGameOver, setIsGameOver] = useState(chessGame.isGameOver());
	const [mostRecentPly, setMostRecentPly] = useState<number>(chessGame.history().length);

	const csrftoken = (
		document.cookie.split('; ').find((row) => row.startsWith('csrftoken=')) || ''
	).split('=')[1];

	// function to make a move on the chess game, and update state accordingly
	const makeMove = useCallback(
		(move: { from: string; to: string; promotion?: string } | string) => {
			chessGame.move(move);
			// update most recent ply after applying the move
			setMostRecentPly(chessGame.history().length);
			setIsPlayersTurn(chessGame.turn() === playerColor);
			if (chessGame.isGameOver()) {
				chessGame.setHeader(
					'Result',
					chessGame.isDraw() ? '1/2-1/2' : chessGame.turn() === 'w' ? '0-1' : '1-0'
				);
				setIsGameOver(true);
				setIsPlayersTurn(false);
			}
		},
		[chessGame, playerColor]
	);

	// handle when the player tries to make a move
	const handleMoveRequest = useCallback(
		(move: { from: string; to: string; promotion?: string }): boolean => {
			if (move.from === 'resign' && move.to === 'resign') {
				const res = playerColor === 'w' ? '0-1' : '1-0';
				chessGame.setHeader('Result', res);
				setIsGameOver(true);
				setIsPlayersTurn(false);
				return true;
			}
			try {
				makeMove(move);
				return true;
			} catch (e: any) {
				if (e instanceof Error && e.message === 'Invalid move') {
					return false;
				}
			}
			return false;
		},
		[chessGame, playerColor, makeMove]
	);

	// whenever it is the engine's turn, we will ask the server for and make a move
	useEffect(() => {
		if (isPlayersTurn || isGameOver) return;
		const ac = new AbortController();

		const fetchEngineMove = async () => {
			try {
				const response = await apiFetch(`/api/engine/move/`, {
					method: 'POST',
					signal: ac.signal,
					headers: {
						Accept: 'application/json',
						'X-CSRFToken': csrftoken,
					},
					body: JSON.stringify({ fen: chessGame.fen() }),
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const data = await response.json();
				return await data.move;
			} catch (e: any) {
				if (e.name === 'AbortError') return;
				console.error('Failed to fetch engine move:', e);
			}
		};
		fetchEngineMove().then((engineMove) => {
			if (engineMove) {
				makeMove(engineMove);
				// engine move applied, update ply
				setMostRecentPly(chessGame.history().length);
				setIsPlayersTurn(chessGame.turn() === playerColor);
			}
		});
		return () => ac.abort();
	}, [isPlayersTurn, isGameOver, chessGame, csrftoken, makeMove, playerColor]);

	const chooseColor = (color: Color) => {
		setPlayerColor(color);
		setIsPlayersTurn(color === 'w');
		setHasChosenColor(true);
		// set headers depending on chosen color
		if (color === 'w') {
			chessGame.setHeader('White', 'Player');
			chessGame.setHeader('Black', 'Engine');
		} else {
			chessGame.setHeader('White', 'Engine');
			chessGame.setHeader('Black', 'Player');
		}
	};

	if (!hasChosenColor) {
		return (
			<div style={{ padding: 20 }}>
				<h2>Play vs Engine</h2>
				<p>Choose a color to begin:</p>
				<div style={{ display: 'flex', gap: 12 }}>
					<button onClick={() => chooseColor('w')}>Play as White</button>
					<button onClick={() => chooseColor('b')}>Play as Black</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<GameViewer
				chessGame={chessGame}
				gameTitle={`Play vs Engine`}
				onMoveRequest={handleMoveRequest}
				pieceDraggingEnabled={isPlayersTurn && !isGameOver}
				isGameActive={!isGameOver}
				boardOrientation={playerColor === 'w' ? 'white' : 'black'}
				currentPly={mostRecentPly}
			/>
		</div>
	);
}
