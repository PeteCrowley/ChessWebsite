import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DatabaseGameViewer from './components/DatabaseGameViewer';
import PlayVsEngine from './components/PlayVsEngine';
import PlayVsPlayer from './components/PlayVsPlayer';
import AnalysisBoard from './components/Analysis';
import Home from './components/Home';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';

function App() {
	return (
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" element={<Home />} />
				<Route path="/game/:gameId" element={<DatabaseGameViewer />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />
					<Route path="/play/engine" element={<PlayVsEngine />} />
					<Route path="/play/:gameId" element={<PlayVsPlayer />} />
					<Route path="/analysis" element={<AnalysisBoard />} />
				</Routes>
			</BrowserRouter>
	);
}

export default App;
