import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, { use, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/PlayQueue.css';

export default function PlayQueue() {
	const WS_URL = `ws://${window.location.host}/ws/play/queue/`;
	const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
		shouldReconnect: () => true,
	});
	const navigate = useNavigate();

	const [username, setUsername] = useState<string>('player');
	const [queued, setQueued] = useState<boolean>(false);
	const [matchedGame, setMatchedGame] = useState<string | null>(null);

	useEffect(() => {
		if (!lastJsonMessage || typeof lastJsonMessage !== 'object') return;
		const ev = (lastJsonMessage as any).event;
		if (ev === 'queued') {
			setQueued(true);
		}
		if (ev === 'matched') {
			setQueued(false);
			setMatchedGame((lastJsonMessage as any).game ?? null);
			navigate(`/play/${(lastJsonMessage as any).game}?user=${username}`);
		}
	}, [lastJsonMessage]);

	const handleJoin = () => {
		if (readyState !== ReadyState.OPEN) return;
		sendJsonMessage({ action: 'join', user: username });
	};

	const handleLeave = () => {
		if (readyState !== ReadyState.OPEN) return;
		sendJsonMessage({ action: 'leave', user: username });
		setQueued(false);
	};

	return (
		<div className="playqueue-page">
			<h3>Play Queue</h3>

			<div className="playqueue-controls">
				<input value={username} onChange={(e) => setUsername(e.target.value)} />
				<button onClick={handleJoin} disabled={queued || readyState !== ReadyState.OPEN}>
					Join Queue
				</button>
				<button onClick={handleLeave} disabled={!queued}>
					Leave Queue
				</button>
			</div>

			<div className="playqueue-status">
				{queued ? (
					<div className="waiting">
						<div className="spinner" />
						<span>Waiting in queue...</span>
					</div>
				) : matchedGame ? (
					<div className="matched">Matched! game id: {matchedGame}</div>
				) : (
					<div>Not queued</div>
				)}
			</div>
		</div>
	);
}
