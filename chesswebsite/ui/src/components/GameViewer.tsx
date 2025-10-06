import React, { useState, useEffect, useRef} from "react";
import { useParams } from "react-router-dom";
import { Chessboard, ChessboardOptions, defaultBoardStyle, fenStringToPositionObject } from "react-chessboard";
import MyChess from "./MyChess";
import "./css/GameViewer.css";

export default function GameViewer() {
  const { gameId } = useParams();
  const chessGameRef = useRef(new MyChess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [ gameLoading, setGameLoading ] = useState(false);
  const [ pgn, setPgn ] = useState(null);
  const [ error, setError ] = useState<string | null>(null);

  const [lastMoveSquares, setLastMoveSquares] = useState<{ from: string; to: string } | null>(
    chessGame.getMostRecentMoveSquares()
  );

  const backgroundFromColor = 'rgba(255, 255, 0, 0.4)';
  const backgroundToColor = 'rgba(255, 255, 0, 0.4)';

  // Fetch game data from the API whenever the gameId changes
  useEffect(() => {
    if (!gameId) return;
    const ac = new AbortController();
    const fetchGame = async () => {
      try {
        setGameLoading(true);
        const response = await fetch(`/api/games/${gameId}/`, {
          signal: ac.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.pgn) {
          setPgn(data.pgn);
          chessGame.loadPgn(data.pgn);
          setChessPosition(chessGame.fen());
        }
        setGameLoading(false);
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setError("Failed to load game data.");
        setGameLoading(false);
      }
    };
    fetchGame();
    return () => ac.abort();
  }, [gameId]);

  // Handle forward/back navigation through moves
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        const nextMove = chessGame.getNextMove();
        if (nextMove){
          chessGame.move(nextMove);
        }
        setChessPosition(chessGame.fen());
      }
      if (event.key === "ArrowLeft") {
        if (chessGame.undo()){
          setChessPosition(chessGame.fen());
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // We want to update the lastMoveSquares whenever chessPosition changes
  useEffect(() => {
    setLastMoveSquares(chessGame.getMostRecentMoveSquares());
  }, [chessPosition]);

  if (gameLoading) return <div>Loading game {gameId}…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;
  if (!gameId) return <div>No game found</div>;

  const chessBoardOpts: ChessboardOptions = {
    position: fenStringToPositionObject(chessPosition, 8, 8),
    allowDragging: false,
    // react-chessboard expects `squareStyles` (not `customSquareStyles`). Use
    // the computed `lastMoveSquares` state so highlights update when
    // `chessPosition` changes.
    squareStyles: lastMoveSquares
      ? {
          [lastMoveSquares.from]: { backgroundColor: backgroundFromColor },
          [lastMoveSquares.to]: { backgroundColor: backgroundToColor },
        }
      : undefined,
    boardStyle: { ...defaultBoardStyle(8), width: "70%", margin: "0 auto"},
  };

  return (
    <div>
      <h2>Game {gameId}</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{pgn}</pre>
      <Chessboard options={chessBoardOpts}/>
    </div>
  );
}
