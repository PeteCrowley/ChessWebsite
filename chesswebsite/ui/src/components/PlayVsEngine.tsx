import React, { useState, useEffect, useRef } from "react";
import ReactiveChess from "./ReactiveChess";
import GameViewer from "./GameViewer";

export default function PlayVsEngine() {
  const chessGameRef = useRef(new ReactiveChess());
  const chessGame = chessGameRef.current;

  const [isPlayersTurn, setIsPlayersTurn] = useState(chessGame.turn() === "w");

  chessGame.setHeader("White", "Player");
  chessGame.setHeader("Black", "Engine");

  function handleMoveRequest(move: {
    from: string;
    to: string;
    promotion?: string;
  }): boolean {
    if(chessGame.getCurrentPly() != chessGame.getAllGameMoves().length){
        return false;
    }
    const result = chessGame.move(move);
    if (result) {
      setIsPlayersTurn(chessGame.turn() === "w");
      return true;
    }
    return false;
  }

  return (
    <div>
      <GameViewer
        chessGame={chessGame}
        gameTitle="Play vs Engine"
        onMoveRequest={handleMoveRequest}
        pieceDraggingEnabled={isPlayersTurn}
      />
    </div>
  );
}
