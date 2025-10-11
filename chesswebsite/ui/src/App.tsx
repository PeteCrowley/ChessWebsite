import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DatabaseGameViewer from './components/DatabaseGameViewer';
import PlayVsEngine from './components/PlayVsEngine';
import PlayVsPlayer from './components/PlayVsPlayer';
import PlayQueue from './components/PlayQueue';
import AnalysisBoard from './components/Analysis';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<h1>Home Page</h1>} />
				<Route path="/game/:gameId" element={<DatabaseGameViewer />} />
				<Route path="/play/engine" element={<PlayVsEngine />} />
				<Route path="/play/:gameId" element={<PlayVsPlayer />} />
				<Route path="/play/queue" element={<PlayQueue />} />
				<Route path="/analysis" element={<AnalysisBoard />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
