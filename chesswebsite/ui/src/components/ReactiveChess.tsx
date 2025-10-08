import { Chess, Move } from "chess.js";

export default class ReactiveChess extends Chess {
  constructor(params?: any) {
    super(params);
  }

  private _listeners = new Set<() => void>();

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
    this._notify();
  }


  override move(
    move: string | { from: string; to: string; promotion?: string } | null,
    { strict = false }: { strict?: boolean } = {},
  ): Move {
    const m = super.move(move, { strict });
    this._notify();
    return m;
  }

  override undo(): Move | null{
    const move = super.undo();
    if (move) {
      this._notify();
    }
    return move;
  }
}
