import React from 'react';

import { BrowserRouter, Routes, Route } from "react-router-dom";
import GameViewer from "./components/GameViewer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/game/:gameId" element={<GameViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
