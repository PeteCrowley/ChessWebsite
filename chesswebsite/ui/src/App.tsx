import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DatabaseGameViewer from "./components/DatabaseGameViewer";
import PlayVsEngine from "./components/PlayVsEngine";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/game/:gameId" element={<DatabaseGameViewer />} />
        <Route path="/play/engine" element={<PlayVsEngine />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
