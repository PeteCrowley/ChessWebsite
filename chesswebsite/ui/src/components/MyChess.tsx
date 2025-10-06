import { Chess } from "chess.js";

export default class MyChess extends Chess {
  constructor(params?: any) {
    super(params);
  }

  private _persistentGameMoves: string[] = [];

  override loadPgn(
    pgn: string,
    {
      strict = false,
      newlineChar = "\r?\n",
    }: { strict?: boolean; newlineChar?: string } = {}
  ): void {
    super.loadPgn(pgn, { strict, newlineChar });
    this._persistentGameMoves = this.history();
  }

  public getNextMove(): string | null {
    if (this._persistentGameMoves.length === 0) return null;
    const nextMoveInd = this.history().length;
    if (nextMoveInd >= this._persistentGameMoves.length) return null;
    return this._persistentGameMoves[nextMoveInd];
  }

  public getMostRecentMoveSquares(): { from: string; to: string } | null {
    if (this.history().length === 0) return null;
    const lastMove = this.history({verbose: true})[this.history().length - 1];
    return {from: lastMove.from, to: lastMove.to};
  }
}
