import React from 'react';
import { Link } from 'react-router-dom';
import PlayQueue from './PlayQueue';
import GamesList from './GamesList';
import './css/Home.css';

export default function Home() {
	return (
		<div className="home-page">
			<h2>Welcome</h2>
			<div className="home-grid">
				<div className="home-card">
					<h3>Find a Game</h3>
					<p>Join the quick play queue and get matched with another player.</p>
					<PlayQueue />
				</div>

				<div className="home-card">
					<h3>Play vs Engine</h3>
					<p>Play a game against the computer at various difficulty levels.</p>
					<Link to="/play/engine">
						<button>Play vs Engine</button>
					</Link>
				</div>

				<div className="home-card">
					<h3>Analysis Board</h3>
					<p>Open the analysis board to test positions or load PGNs.</p>
					<Link to="/analysis">
						<button>Go to Analysis</button>
					</Link>
				</div>
			</div>

			<div className="home-card games-card">
				<GamesList />
			</div>
		</div>
	);
}
