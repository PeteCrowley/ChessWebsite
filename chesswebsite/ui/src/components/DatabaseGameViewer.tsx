import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import ReactiveChess from './ReactiveChess';
import './css/GameViewer.css';
import GameViewer from './GameViewer';
import apiFetch from '../lib/api';

export default function DatabaseGameViewer() {
	const { gameId } = useParams();

	const chessGameRef = useRef(new ReactiveChess());
	const chessGame = chessGameRef.current;

	const [gameLoading, setGameLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch game data from the API whenever the gameId changes
	useEffect(() => {
		if (!gameId) return;
		const ac = new AbortController();
		const fetchGame = async () => {
			try {
				setGameLoading(true);
				const response = await apiFetch(`/api/games/${gameId}/`, {
					signal: ac.signal,
					headers: { Accept: 'application/json' },
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const data = await response.json();
				if (data.pgn) {
					chessGame.loadPgn(data.pgn);
				}
				setGameLoading(false);
			} catch (e: any) {
				if (e.name === 'AbortError') return;
				setError('Failed to load game data.');
				setGameLoading(false);
			}
		};
		fetchGame();
		return () => ac.abort();
	}, [gameId, chessGame]);

	if (gameLoading) return <div>Loading game {gameId}…</div>;
	if (error) return <div style={{ color: 'crimson' }}>Error: {error}</div>;
	if (!gameId) return <div>No game found</div>;

	return (
		<div className="database-gameviewer-page">
			<GameViewer
				chessGame={chessGame}
				gameTitle={`Game ${gameId}`}
				pieceDraggingEnabled={false}
			/>
		</div>
	);
}
