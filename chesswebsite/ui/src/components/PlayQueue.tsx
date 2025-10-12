import useWebSocket, { ReadyState } from 'react-use-websocket';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/PlayQueue.css';
import { useAuth } from './AuthContext';
import { buildWsUrl } from '../lib/api';

export default function PlayQueue() {
	const auth = useAuth();
    const WS_URL = buildWsUrl(`/ws/play/queue/`);

	const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL, {
		shouldReconnect: () => true,
	});
	const navigate = useNavigate();

	const username = auth.user?.username ?? 'anonymous';

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
			navigate(`/play/${(lastJsonMessage as any).game}`);
		}
	}, [lastJsonMessage]);

	const handleJoin = () => {
		if (readyState !== ReadyState.OPEN) return;
		sendJsonMessage({ action: 'join' });
	};

	const handleLeave = () => {
		if (readyState !== ReadyState.OPEN) return;
		sendJsonMessage({ action: 'leave' });
		setQueued(false);
	};

	return (
		<div className="playqueue-page">
			<h3>Play Queue</h3>

			<div className="playqueue-controls">
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
