import { Graph } from '../../../graph/types/graph';

export class PlanaritySceneHistoryManager {
  private history: Graph[] = [];
  private historyIndex: number = -1;
  private undoAction: () => void;
  private redoAction: () => void;

  constructor(undoAction: () => void, redoAction: () => void) {
    this.undoAction = undoAction;
    this.redoAction = redoAction;
  }

  public commitToHistory(...graphs: Graph[]): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(...graphs);
    this.historyIndex += graphs.length;
  }

  public undo(): void {
    if (this.historyIndex <= 0) {
      return;
    }

    this.historyIndex--;
    this.undoAction();
  }

  public redo(): void {
    if (this.historyIndex >= this.history.length - 1) {
      return;
    }

    this.historyIndex++;
    this.redoAction();
  }

  public getLast(): Graph {
    return this.history[this.historyIndex];
  }

  public getCount(): number {
    return this.history.length;
  }
}
