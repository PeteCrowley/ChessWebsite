import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Chessboard,
  ChessboardOptions,
  defaultBoardStyle,
  fenStringToPositionObject,
} from "react-chessboard";
import MyChess from "./MyChess";
import "./css/GameViewer.css";

export default function GameViewer() {
  const { gameId } = useParams();
  const chessGameRef = useRef(new MyChess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [gameLoading, setGameLoading] = useState(false);
  const [pgn, setPgn] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [moveRows, setMoveRows] = useState<
    { white: string | null; black: string | null }[]
  >([]);
  const [chessBoardOpts, setChessBoardOpts] = useState<
    ChessboardOptions | undefined
  >(undefined);
  const [whitePlayer, setWhitePlayer] = useState<string | null>(null);
  const [blackPlayer, setBlackPlayer] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // ref for the notation list container so we can auto-scroll the current move into view
  const notationListRef = useRef<HTMLDivElement | null>(null);

  const backgroundFromColor = "rgba(255, 255, 0, 0.4)";
  const backgroundToColor = "rgba(255, 255, 0, 0.4)";

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
          // extract headers (White/Black/Result) if available
          const headers = chessGame.getHeaders();
          setWhitePlayer(headers["White"] ?? null);
          setBlackPlayer(headers["Black"] ?? null);
          setResult(headers["Result"] ?? null);
          setChessPosition(chessGame.fen());
          // Build move rows for notation display
          const allGameMoves = chessGame.getAllGameMoves();
          type MoveRow = { white: string | null; black: string | null };
          const rows: MoveRow[] = [];
          for (let i = 0; i < allGameMoves.length; i += 2) {
            const white = allGameMoves[i] || null;
            const black = allGameMoves[i + 1] || null;
            rows.push({ white, black });
          }
          setMoveRows(rows);
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

  // Handle game navigation via keyboard arrows
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const active = document.activeElement as HTMLElement | null;
      const isTypingField =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable);
      if (isTypingField) return;

      if (event.key === "ArrowRight") {
        const nextMove = chessGame.getNextMove();
        if (nextMove) {
          chessGame.move(nextMove);
        }
        setChessPosition(chessGame.fen());
      }
      if (event.key === "ArrowLeft") {
        if (chessGame.undo()) {
          setChessPosition(chessGame.fen());
        }
      }
      if (event.key === "ArrowUp") {
        // prevent page scroll
        event.preventDefault();
        chessGame.goToMove(0);
        setChessPosition(chessGame.fen());
      }
      if (event.key === "ArrowDown") {
        // prevent page scroll
        event.preventDefault();
        chessGame.goToMove(chessGame.getAllGameMoves().length);
        setChessPosition(chessGame.fen());
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // We want to do a few of things when the position changes, so centralize it here
  useEffect(() => {
    // Update last move squares
    const lastMoveSquares = chessGame.getMostRecentMoveSquares();

    // Update chessboard options
    const newOpts: ChessboardOptions = {
      id: "GameViewer",
      position: fenStringToPositionObject(chessPosition, 8, 8),
      allowDragging: false,
      squareStyles: lastMoveSquares
        ? {
            [lastMoveSquares.from]: { backgroundColor: backgroundFromColor },
            [lastMoveSquares.to]: { backgroundColor: backgroundToColor },
          }
        : undefined,
      boardStyle: {
        ...defaultBoardStyle(8),
        margin: "0 auto",
        height: "75vh",
        width: "75vh",
      },
    };
    setChessBoardOpts(newOpts);

    // auto-scroll the notation list when the position changes so the current move is visible
    const container = notationListRef.current;
    if (!container) return;
    const currentEl = container.querySelector(".current") as HTMLElement | null;
    if (!currentEl) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = currentEl.getBoundingClientRect();
    if (
      elRect.top < containerRect.top ||
      elRect.bottom > containerRect.bottom
    ) {
      currentEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chessPosition]);

  if (gameLoading) return <div>Loading game {gameId}…</div>;
  if (error) return <div style={{ color: "crimson" }}>Error: {error}</div>;
  if (!gameId) return <div>No game found</div>;

  return (
    <div className="gameviewer-page">
      <h2>Game {gameId}</h2>
      <div className="gameviewer-grid">
        <div className="board-column">
          {blackPlayer ? (
            <div className="player black">{blackPlayer}</div>
          ) : null}

          <Chessboard options={chessBoardOpts} />

          {whitePlayer ? (
            <div className="player white">{whitePlayer}</div>
          ) : null}
        </div>
        <div className="notation-column">
          <div className="notation-header">Moves</div>
          <div className="notation-list" ref={notationListRef}>
            <table className="notation-table">
              <tbody>
                {moveRows.map((r, idx) => {
                  const whitePly = idx * 2 + 1; // ply numbers starting at 1
                  const blackPly = idx * 2 + 2;
                  const plyIndex = chessGame.getCurrentPly(); // current ply index
                  return (
                    <tr key={idx + 1} className={"notation-row"}>
                      <td className="notation-movenumber">{idx + 1}.</td>
                      <td
                        className={
                          "notation-move " +
                          (plyIndex === whitePly ? "current" : "")
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          chessGame.goToMove(whitePly);
                          setChessPosition(chessGame.fen());
                        }}
                      >
                        {r.white ?? ""}
                      </td>
                      <td
                        className={
                          "notation-move " +
                          (plyIndex === blackPly ? "current" : "")
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          chessGame.goToMove(blackPly);
                          setChessPosition(chessGame.fen());
                        }}
                      >
                        {r.black ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {result ? (
                <tfoot>
                  <tr>
                    <td
                      colSpan={3}
                      style={{
                        paddingTop: "12px",
                        textAlign: "center",
                        color: "#333",
                      }}
                    >
                      <h4>Result: {result}</h4>
                    </td>
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
