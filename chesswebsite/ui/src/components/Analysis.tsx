import React, { useRef, useCallback, useMemo, useState } from 'react';

import ReactiveChess from './ReactiveChess';
import './css/GameViewer.css';
import GameViewer from './GameViewer';

export default function AnalysisBoard() {
	const chessGameRef = useRef(new ReactiveChess());
	const chessGame = chessGameRef.current;
	const [mostRecentPly, setMostRecentPly] = useState<number>(0);
	const [pgnInput, setPgnInput] = useState<string>('');
	const [fenInput, setFenInput] = useState<string>('');

	// function to make a move on the chess game, and update state accordingly
	const makeMove = (move: { from: string; to: string; promotion?: string } | string) => {
		chessGame.move(move);
		setMostRecentPly(chessGame.history().length);
		if (chessGame.isGameOver()) {
			chessGame.setHeader(
				'Result',
				chessGame.isDraw() ? '1/2-1/2' : chessGame.turn() === 'w' ? '0-1' : '1-0'
			);
		}
	};

	// handle when the player tries to make a move
	const handleMoveRequest = useCallback(
		(move: { from: string; to: string; promotion?: string }): boolean => {
			if (move.from === 'resign' && move.to === 'resign') {
				return false;
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
		[chessGame]
	);

	const handleUndo = useCallback(() => {
		const mv = chessGame.undo();
		setMostRecentPly(chessGame.history().length);
		return mv;
	}, [chessGame]);

	const handleSetPgn = useCallback(() => {
		try {
			chessGame.loadPgn(pgnInput);
			setMostRecentPly(chessGame.history().length);
		} catch (e) {
			console.error('Failed to load PGN', e);
		}
	}, [chessGame, pgnInput]);

	const handleSetFen = useCallback(() => {
		try {
			chessGame.load(fenInput);
			setMostRecentPly(chessGame.history().length);
		} catch (e) {
			console.error('Failed to load FEN', e);
		}
	}, [chessGame, fenInput]);

	return (
		<div>
			<GameViewer
				chessGame={chessGame}
				gameTitle={`Player vs Player`}
				onMoveRequest={handleMoveRequest}
				pieceDraggingEnabled={true}
				currentPly={mostRecentPly}
			/>
			<div style={{ marginTop: 12 }}>
				<button onClick={() => handleUndo()}>Undo</button>
			</div>

			<div style={{ marginTop: 12 }}>
				<label>
					Set PGN:
					<br />
					<textarea
						value={pgnInput}
						onChange={(e) => setPgnInput(e.target.value)}
						rows={6}
						style={{ width: '100%' }}
					/>
				</label>
				<br />
				<button onClick={handleSetPgn}>Load PGN</button>
			</div>

			<div style={{ marginTop: 12 }}>
				<label>
					Set FEN:
					<br />
					<input
						type="text"
						value={fenInput}
						onChange={(e) => setFenInput(e.target.value)}
						style={{ width: '100%' }}
					/>
				</label>
				<br />
				<button onClick={handleSetFen}>Load FEN</button>
			</div>
		</div>
	);
}
