import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DatabaseGameViewer from "./components/DatabaseGameViewer";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Home Page</h1>} />
        <Route path="/game/:gameId" element={<DatabaseGameViewer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
