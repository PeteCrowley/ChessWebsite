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
};

export default function GameViewer({
  chessGame: chessGameInstance,
  gameTitle,
  onMoveRequest = () => true,
  pieceDraggingEnabled = false,
  boardOrientation = "white",
}: GameViewerProps) {
  // the chessGame that we will build the viewer around
  const chessGameRef = useRef<ReactiveChess>(chessGameInstance);
  const chessGame = chessGameRef.current;

  // state we derive from chessGame, will only be updated from subscription to chessGame object
  const [fen, setFen] = useState(chessGame.fen());
  const [moveRows, setMoveRows] = useState<
    { white: string | null; black: string | null }[]
  >(chessGame.getMoveRows());
  const [headers, setHeaders] = useState<{ [key: string]: string }>(() =>
    chessGame.getHeaders()
  );
  const [currentPly, setCurrentPly] = useState(chessGame.getCurrentPly());
  const [lastMoveSquares, setLastMoveSquares] = useState<{
    from: string;
    to: string;
  } | null>(chessGame.getMostRecentMoveSquares());
  
  // subscribe to chessGame changes and update state whenever the game changes
  useEffect(() => {
    const onGameChange = () => {
      setFen(chessGame.fen());
      setMoveRows(chessGame.getMoveRows());
      setHeaders(chessGame.getHeaders());
      setCurrentPly(chessGame.getCurrentPly());
      setLastMoveSquares(chessGame.getMostRecentMoveSquares());
    };
    const unsub = chessGame.subscribe(onGameChange);
    onGameChange();
    return () => {
      unsub();
    };
  }, [chessGameInstance]);

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
        chessGame.navigateForwardOneMove();
      }
      if (event.key === "ArrowLeft") {
        if (chessGame.navigateBackOneMove()) {
        }
      }
      if (event.key === "ArrowUp") {
        // prevent page scroll
        event.preventDefault();
        chessGame.goToMove(0);
      }
      if (event.key === "ArrowDown") {
        // prevent page scroll
        event.preventDefault();
        chessGame.goToMove(chessGame.getAllGameMoves().length);
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
  }, [boardOrientationState]);

  // memo the style for the chessboard so it doesn't get recreated on every render
  const memoBoardStyle = useMemo(() => {
    return {
      ...defaultBoardStyle(8),
      margin: "0 auto",
      height: "75vh",
      width: "75vh",
    };
  }, []);
  
  // the function called when a piece is dropped on a board (assuming pieces are draggable)
  const handlePieceDropCallback = useCallback(({piece, sourceSquare, targetSquare}: 
    PieceDropHandlerArgs) => {
    if (!sourceSquare || !targetSquare) {
          return false;
        }
        // must be at most recent move
        if (chessGame.getCurrentPly() !== chessGame.getAllGameMoves().length) {
          return false;
        }
        return onMoveRequest({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        });
  }, [onMoveRequest]);

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

  // players and result from headers we display
  const whitePlayer = chessGame.getHeaders()["White"] ?? null;
  const blackPlayer = chessGame.getHeaders()["Black"] ?? null;
  const result = chessGame.getHeaders()["Result"] ?? null;

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
