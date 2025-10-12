import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './css/GamesList.css';
import { useAuth } from './AuthContext';
import apiFetch from '../lib/api';

interface Game {
	id: string;
	pgn: string;
}

interface GameInfo {
	id: string;
	white: string;
	black: string;
	result: string;
	date: string;
	isPlayerInvolved: boolean;
	isGameActive: boolean;
}

export default function GamesList() {
	const [games, setGames] = useState<GameInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const auth = useAuth();
	const username = auth.isAuthenticated ? (auth.user?.username ?? '') : '';
	const [playerFilter, setPlayerFilter] = useState('');

	useEffect(() => {
		const fetchGames = async () => {
			try {
				setLoading(true);
				const response = await apiFetch('/api/games/', {
					headers: { Accept: 'application/json' },
				});
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const data: Game[] = await response.json();

				// Parse PGN headers to extract white, black, result
				const gameInfos: GameInfo[] = data.map((game) => {
					const headers = parsePgnHeaders(game.pgn);
					return {
						id: game.id,
						white: headers.White || 'Unknown',
						black: headers.Black || 'Unknown',
						result: headers.Result
							? headers.Result === '*'
								? 'In Progress'
								: headers.Result
							: '*',
						date: headers.Date || '????.??.??',
						isPlayerInvolved: headers.White === username || headers.Black === username,
						isGameActive: headers.Result === '*',
					};
				});
				gameInfos.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

				setGames(gameInfos);
				setLoading(false);
			} catch (e: any) {
				setError('Failed to load games');
				setLoading(false);
			}
		};

		fetchGames();
	}, [username]);

	// Simple PGN header parser
	const parsePgnHeaders = (pgn: string): Record<string, string> => {
		const headers: Record<string, string> = {};
		const lines = pgn.split('\n');
		for (const line of lines) {
			const match = line.match(/^\[(\w+)\s+"([^"]*)"\]/);
			if (match) {
				headers[match[1]] = match[2];
			}
		}
		return headers;
	};

	if (loading) return <div className="games-list">Loading games...</div>;
	if (error) return <div className="games-list error">{error}</div>;

	return (
		<div className="games-list">
			<div className="games-list-controls">
				<label>
					Filter by player:&nbsp;
					<input
						value={playerFilter}
						onChange={(e) => setPlayerFilter(e.target.value)}
						placeholder="player name"
					/>
				</label>
				{playerFilter && <button onClick={() => setPlayerFilter('')}>Clear</button>}
			</div>
			<h3>Recent Games</h3>
			{games.length === 0 ? (
				<p>No games found.</p>
			) : (
				<div className="games-table">
					{games
						.filter((g) => {
							if (!playerFilter) return true;
							return g.white.includes(playerFilter) || g.black.includes(playerFilter);
						})
						.map((game) => (
							<div key={game.id} className="game-row">
								<div className="game-players">
									<span className="white-player">{game.white}</span>
									<span className="vs">vs</span>
									<span className="black-player">{game.black}</span>
								</div>
								<div className="game-date">{game.date}</div>
								<div className="game-result">{game.result}</div>
								<div className="game-actions">
									{game.isPlayerInvolved && game.isGameActive ? (
										<Link to={`/play/${game.id}`} className="view-game-link">
											Play{' '}
										</Link>
									) : (
										<Link to={`/game/${game.id}`} className="view-game-link">
											View{' '}
										</Link>
									)}
								</div>
							</div>
						))}
				</div>
			)}
		</div>
	);
}
