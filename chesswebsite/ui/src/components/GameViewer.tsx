import React, { useState, useEffect, useRef } from "react";
import {
  Chessboard,
  ChessboardOptions,
  defaultBoardStyle,
  fenStringToPositionObject,
} from "react-chessboard";
import MyChess from "./MyChess";
import "./css/GameViewer.css";

type MoveRequest = { from: string; to: string; promotion?: string };

type GameViewerProps = {
  chessGame: MyChess;
  gameTitle: string;
  onMoveRequest?: (move: MoveRequest) => boolean;
  pieceDraggingEnabled?: boolean;
  boardOrientation?: "white" | "black";
};

export default function GameViewer({
  chessGame,
  gameTitle,
  onMoveRequest = () => true,
  pieceDraggingEnabled = false,
  boardOrientation = "white",
}: GameViewerProps) {
  const chessGameRef = useRef<MyChess>(chessGame);
  const chessGameInstance = chessGameRef.current;

  // initial position from the chess instance
  const [chessPosition, setChessPosition] = useState<string>(() =>
    chessGameInstance.fen()
  );

  const [boardOrientationState, setBoardOrientationState] = useState<
    "white" | "black"
  >(boardOrientation);

  const moveRows = []
  const allGameMoves = chessGameInstance.getAllGameMoves();
  for (let i = 0; i < allGameMoves.length; i += 2) {
    const white = allGameMoves[i] || null;
    const black = allGameMoves[i + 1] || null;
    moveRows.push({ white, black });
  }

  const [chessBoardOpts, setChessBoardOpts] = useState<
    ChessboardOptions | undefined
  >(undefined);

  const whitePlayer = chessGameInstance.getHeaders()["White"] ?? null;
  const blackPlayer = chessGameInstance.getHeaders()["Black"] ?? null;
  const result = chessGameInstance.getHeaders()["Result"] ?? null;

  // ref for the notation list container so we can auto-scroll the current move into view
  const notationListRef = useRef<HTMLDivElement | null>(null);

  const backgroundFromColor = "rgba(255, 255, 0, 0.4)";
  const backgroundToColor = "rgba(255, 255, 0, 0.4)";

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
        const nextMove = chessGameInstance.getNextMove();
        if (nextMove) {
          chessGameInstance.move(nextMove);
        }
        setChessPosition(chessGameInstance.fen());
      }
      if (event.key === "ArrowLeft") {
        if (chessGameInstance.navigateBackOneMove()) {
          setChessPosition(chessGameInstance.fen());
        }
      }
      if (event.key === "ArrowUp") {
        // prevent page scroll
        event.preventDefault();
        chessGameInstance.goToMove(0);
        setChessPosition(chessGameInstance.fen());
      }
      if (event.key === "ArrowDown") {
        // prevent page scroll
        event.preventDefault();
        chessGameInstance.goToMove(chessGameInstance.getAllGameMoves().length);
        setChessPosition(chessGameInstance.fen());
      }
      if (event.key === "f"){
        setBoardOrientationState(prev => (prev === "white" ? "black" : "white"));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [boardOrientationState]);

  // We want to do a few of things when the position changes, so centralize it here
  useEffect(() => {
    // Update last move squares
    const lastMoveSquares = chessGameInstance.getMostRecentMoveSquares();

    // Update chessboard options
    const newOpts: ChessboardOptions = {
      id: "GameViewer",
      position: fenStringToPositionObject(chessPosition, 8, 8),
      allowDragging: pieceDraggingEnabled,
      boardOrientation: boardOrientationState,
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
      onPieceDrop: ({piece, sourceSquare, targetSquare}) => {
        if (!sourceSquare || !targetSquare ){
          return false;
        }
        return onMoveRequest({from: sourceSquare, to: targetSquare, promotion: "q"})
      }
    };
    setChessBoardOpts(newOpts);

    // auto-scroll the notation list when the position changes so the current move is visible
    const container = notationListRef.current;
    if (!container) return;
    const currentEl = container.querySelector(".current") as HTMLElement | null;
    if (!currentEl) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = currentEl.getBoundingClientRect();
    if (elRect.top < containerRect.top || elRect.bottom > containerRect.bottom) {
      currentEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chessPosition, pieceDraggingEnabled, boardOrientationState]);
  
  return (
    <div className="gameviewer-page">
      <h2>{gameTitle}</h2>
      <div className="gameviewer-grid">
        <div className="board-column">
          {boardOrientationState === "white" ? 
            (blackPlayer ? <div className="player black">{blackPlayer}</div> : null):
            (whitePlayer ? <div className="player white">{whitePlayer}</div> : null)}

          <Chessboard options={chessBoardOpts} />

          {boardOrientationState === "white" ?
            (whitePlayer ? <div className="player white">{whitePlayer}</div> : null):
            (blackPlayer ? <div className="player black">{blackPlayer}</div> : null)}
        </div>
        <div className="notation-column">
          <div className="notation-header">Moves</div>
          <div className="notation-list" ref={notationListRef}>
            <table className="notation-table">
              <tbody>
                {moveRows.map((r, idx) => {
                  const whitePly = idx * 2 + 1; // ply numbers starting at 1
                  const blackPly = idx * 2 + 2;
                  const plyIndex = chessGameInstance.getCurrentPly(); // current ply index
                  return (
                    <tr key={idx + 1} className={"notation-row"}>
                      <td className="notation-movenumber">{idx + 1}.</td>
                      <td
                        className={
                          "notation-move " + (plyIndex === whitePly ? "current" : "")
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          chessGameInstance.goToMove(whitePly);
                          setChessPosition(chessGameInstance.fen());
                        }}
                      >
                        {r.white ?? ""}
                      </td>
                      <td
                        className={
                          "notation-move " + (plyIndex === blackPly ? "current" : "")
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          chessGameInstance.goToMove(blackPly);
                          setChessPosition(chessGameInstance.fen());
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
