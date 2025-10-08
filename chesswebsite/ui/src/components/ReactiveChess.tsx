import { Chess, Move } from "chess.js";

export default class ReactiveChess extends Chess {
  constructor(params?: any) {
    super(params);
  }

  private _listeners = new Set<() => void>();
  private _persistentGameMoves: string[] = [];

  public subscribe(cb: () => void): () => void {
    this._listeners.add(cb);
    return () => {
      this._listeners.delete(cb);
    };
  }

  private _notify(): void {
    for (const cb of Array.from(this._listeners)) {
      try {
        cb();
      } catch (e) {
        // If there is an error in one we don't want to block the others
      }
    }
  }

  override loadPgn(
    pgn: string,
    {
      strict = false,
      newlineChar = "\r?\n",
    }: { strict?: boolean; newlineChar?: string } = {}
  ): void {
    super.loadPgn(pgn, { strict, newlineChar });
    this._persistentGameMoves = this.history();
    this._notify();
  }

  public getNextMove(): string | null {
    if (this._persistentGameMoves.length === 0) return null;
    const nextMoveInd = this.history().length;
    if (nextMoveInd >= this._persistentGameMoves.length) return null;
    return this._persistentGameMoves[nextMoveInd];
  }

  public getMostRecentMoveSquares(): { from: string; to: string } | null {
    if (this.history().length === 0) return null;
    const lastMove = this.history({ verbose: true })[this.history().length - 1];
    return { from: lastMove.from, to: lastMove.to };
  }

  public getAllGameMoves(): string[] {
    return this._persistentGameMoves;
  }

  override move(
    move: string | { from: string; to: string; promotion?: string } | null,
    { strict = false }: { strict?: boolean } = {},
  ): Move {
    const m = super.move(move, { strict });
    this._persistentGameMoves.push(m.san);
    this._notify();
    return m;
  }

  override undo(): Move | null{
    const move = super.undo();
    if (move) {
      this._persistentGameMoves.pop();
      this._notify();
    }
    return move;
  }

  public navigateBackOneMove(): Move | null {
    const res = super.undo();
    if (res) this._notify();
    return res;
  }

  public navigateForwardOneMove(): Move | null {
    const nextMove = this.getNextMove();
    if (!nextMove) return null;
    const m = super.move(nextMove);
    this._notify();
    return m;
  }

  public getCurrentPly(): number {
    return this.history().length;
  }

  public getMoveRows(): {white: string | null, black: string| null}[] {
    const moveRows = []
    const allGameMoves = this.getAllGameMoves();
    for (let i = 0; i < allGameMoves.length; i += 2) {
      const white = allGameMoves[i] || null;
      const black = allGameMoves[i + 1] || null;
      moveRows.push({ white, black });
    }
    return moveRows;
  }

  public goToMove(ply: number): void {
    if (ply < 0 || ply > this._persistentGameMoves.length) {
      throw new Error(`Invalid ply number ${ply}`);
    }
    while (this.getCurrentPly() < ply) {
      this.navigateForwardOneMove();
    }
    while (this.getCurrentPly() > ply) {
      this.navigateBackOneMove();
    }
    this._notify();
  }
}
