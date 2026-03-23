export interface ISurfaceScene {
  setVisible(visible: boolean): void;
  autoUpdate(t: number): void;
  updateGraphEmbedding(t: number, automatic: boolean): void;
  updateShape(t: number, automatic: boolean): void;
}
