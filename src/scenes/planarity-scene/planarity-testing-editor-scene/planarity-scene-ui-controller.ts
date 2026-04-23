// planarity-scene-ui-controller.ts

import { Graph } from '../../../graph/types/graph';
import { PlanarityPageStatusMode } from '../../../pages/planarity-page/planarity-page-status-mode';

export class PlanaritySceneUIController {
  constructor(
    private readonly updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void,
    private readonly updateUIGraphRepresentation: (graph: Graph) => void
  ) {}

  // Method to update the status in the UI
  public updateStatus(text: string, mode: PlanarityPageStatusMode): void {
    this.updateUIStatus(text, mode);
  }

  // Method to update the graph representation in the UI
  public updateGraphRepresentation(graph: Graph): void {
    this.updateUIGraphRepresentation(graph);
  }
}
