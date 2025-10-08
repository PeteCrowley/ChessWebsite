import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Chessboard,
  ChessboardOptions,
  defaultBoardStyle,
  fenStringToPositionObject,
  PieceDropHandlerArgs,
} from "react-chessboard";
import ReactiveChess from "./ReactiveChess";
import "./css/GameViewer.css";

type MoveRequest = { from: string; to: string; promotion?: string };

type GameViewerProps = {
  chessGame: ReactiveChess;
  gameTitle: string;
  onMoveRequest?: (move: MoveRequest) => boolean;
  pieceDraggingEnabled?: boolean;
  boardOrientation?: "white" | "black";
  currentPly?: number;
};

export default function GameViewer({
  chessGame: chessGameInstance,
  gameTitle,
  onMoveRequest = () => true,
  pieceDraggingEnabled = false,
  boardOrientation = "white",
  currentPly: initialPly = undefined,
}: GameViewerProps) {
  // the chessGame that we will build the viewer around
  const chessGameRef = useRef<ReactiveChess>(chessGameInstance);
  const chessGame = chessGameRef.current;

  // state we derive from chessGame, will only be updated from subscription to chessGame object
  const [fen, setFen] = useState(chessGame.fen());

  const [headers, setHeaders] = useState<{ [key: string]: string }>(() =>
    chessGame.getHeaders()
  );
  const [history, setHistory] = useState(chessGame.history({ verbose: true }));
  const [currentPly, setCurrentPly] = useState(history.length);
  const [lastMoveSquares, setLastMoveSquares] = useState<{
    from: string;
    to: string;
  } | null>(null);
  
  // subscribe to chessGame changes and update state whenever the game changes
  useEffect(() => {
    const onGameChange = () => {
      setHeaders(chessGame.getHeaders());
      setHistory(chessGame.history({ verbose: true }));
      if (initialPly !== undefined) {
        setCurrentPly(Math.min(initialPly, chessGame.history().length));
      }
    };
    const unsub = chessGame.subscribe(onGameChange);
    onGameChange();
    return () => {
      unsub();
    };
  }, [chessGameInstance, initialPly]);

  // the currentPly will determine the position we see
  useEffect(() => {
    setFen(() => {
      if (history.length === 0) {
        return chessGame.fen();
      }
      if (currentPly === 0) {
        return history[0].before;
      }
      return history[currentPly - 1].after;
    });
    setLastMoveSquares(() => {
      if (history.length === 0 || currentPly === 0) return null;
      return {from: history[currentPly - 1].from, to: history[currentPly - 1].to}
    }
    );
  }, [currentPly, chessGame, history]);

  // whether the board is oriented with white or black at the bottom
  const [boardOrientationState, setBoardOrientationState] = useState<
    "white" | "black"
  >(boardOrientation);

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
        setCurrentPly((prev) => Math.min(prev + 1, history.length));
      }
      if (event.key === "ArrowLeft") {
        setCurrentPly((prev) => Math.max(prev - 1, 0));
      }
      if (event.key === "ArrowUp") {
        // prevent page scroll
        event.preventDefault();
        setCurrentPly(0);
      }
      if (event.key === "ArrowDown") {
        // prevent page scroll
        event.preventDefault();
        setCurrentPly(history.length);
      }
      if (event.key === "f") {
        setBoardOrientationState((prev) =>
          prev === "white" ? "black" : "white"
        );
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [boardOrientationState, currentPly, history]);

  // memo the style for the chessboard so it doesn't get recreated on every render
  const memoBoardStyle = useMemo(() => {
    return {
      ...defaultBoardStyle(8),
      margin: "0 auto",
      height: "70vh",
      width: "70vh",
    };
  }, []);
  
  // the function called when a piece is dropped on a board (assuming pieces are draggable)
  const handlePieceDropCallback = useCallback(({piece, sourceSquare, targetSquare}: 
    PieceDropHandlerArgs) => {
    if (!sourceSquare || !targetSquare) {
          return false;
        }
        // must be at most recent move
        if (currentPly !== history.length) {
          return false;
        }
        const moveAccepted = onMoveRequest({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
        if (moveAccepted){
          setCurrentPly((prev) => prev + 1);
        }
        return moveAccepted;
  }, [onMoveRequest, history, currentPly]);

  // Background square colors for last move
  const backgroundFromColor = "rgba(255, 255, 0, 0.4)";
  const backgroundToColor = "rgba(255, 255, 0, 0.4)";

  // chessboard options, memoized so they don't get recreated on every render
  const chessBoardOptions = useMemo<ChessboardOptions>(() => {
    return {
      id: "GameViewer",
      position: fenStringToPositionObject(fen, 8, 8),
      allowDragging: pieceDraggingEnabled,
      boardOrientation: boardOrientationState,
      squareStyles: lastMoveSquares
       ?{
          [lastMoveSquares.from]: { backgroundColor: backgroundFromColor },
          [lastMoveSquares.to]: { backgroundColor: backgroundToColor },
        }:
        undefined,
      boardStyle: memoBoardStyle,
      onPieceDrop: handlePieceDropCallback,
    };
  }, [fen, pieceDraggingEnabled, boardOrientationState, lastMoveSquares, onMoveRequest, chessGame]);

  // ref for the notation list container so we can auto-scroll the current move into view
  const notationListRef = useRef<HTMLDivElement | null>(null);
  // auto-scroll the notation list when the position changes so the current move is visible
  useEffect(() => {
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
  }, [currentPly]);

  const moveRows = useMemo(() => {
    const rows: { white: string | null; black: string | null }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      rows.push({
        white: history[i] ? history[i].san : null,
        black: history[i + 1] ? history[i + 1].san : null,
      });
    }
    return rows;
  }, [history]);

  // players and result from headers we display
  const whitePlayer = headers["White"] ?? null;
  const blackPlayer = headers["Black"] ?? null;
  const result = headers["Result"] ?? null;

  return (
    <div className="gameviewer-page">
      <h2>{gameTitle}</h2>
      <div className="gameviewer-grid">
        <div className="board-column">
          {boardOrientationState === "white" ? (
            blackPlayer ? (
              <div className="player black">{blackPlayer}</div>
            ) : null
          ) : whitePlayer ? (
            <div className="player white">{whitePlayer}</div>
          ) : null}

          <Chessboard options={chessBoardOptions} />

          {boardOrientationState === "white" ? (
            whitePlayer ? (
              <div className="player white">{whitePlayer}</div>
            ) : null
          ) : blackPlayer ? (
            <div className="player black">{blackPlayer}</div>
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
                  return (
                    <tr key={idx + 1} className={"notation-row"}>
                      <td className="notation-movenumber">{idx + 1}.</td>
                      <td
                        className={
                          "notation-move " +
                          (currentPly === whitePly ? "current" : "")
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPly(whitePly);
                        }}
                      >
                        {r.white ?? ""}
                      </td>
                      <td
                        className={
                          "notation-move " +
                          (currentPly === blackPly ? "current" : "")
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPly(blackPly);
                        }}
                      >
                        {r.black ?? ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {result && result != "*" ? (
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
