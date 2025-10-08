import { Chess, Move } from "chess.js";

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
    const lastMove = this.history({ verbose: true })[this.history().length - 1];
    return { from: lastMove.from, to: lastMove.to };
  }

  public getAllGameMoves(): string[] {
    return this._persistentGameMoves;
  }

  override undo(): Move | null{
    const move = super.undo();
    if (move) {
      this._persistentGameMoves.pop();
    }
    return move;
  }

  public navigateBackOneMove(): Move | null {
    return super.undo();
  }

  public getCurrentPly(): number {
    return this.history().length;
  }

  public goToMove(ply: number): void {
    if (ply < 0 || ply > this._persistentGameMoves.length) {
      throw new Error(`Invalid ply number ${ply}`);
    }
    while (this.getCurrentPly() < ply) {
      const nextMove = this.getNextMove();
      if (nextMove) this.move(nextMove);
    }
    while (this.getCurrentPly() > ply) {
      this.navigateBackOneMove();
    }
  }
}
