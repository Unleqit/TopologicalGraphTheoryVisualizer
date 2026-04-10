import { combinatorialEmbeddingToPosStepWise } from '../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { PlanarityPageStatusMode } from '../../pages/planarity-page/planarity-page-status-mode';
import { graphLayoutService } from './layout/index';
import { Graph } from '../../graph/types/graph';
import { PLANARITY_SCENE_DEFAULT_GRAPH_RESULT } from './planarity-scene-default-graph';
import { PlanaritySceneHistoryManager } from './planarity-scene-history-manager';
import { PlanaritySceneSelectionManager } from './planarity-scene-selection-manager';
import { PlanaritySceneBase } from './planarity-scene-base';
import { PlanaritySceneRenderController } from './planarity-scene-render-controller';
import { PlanaritySceneInteractionController } from './planarity-scene-interaction-controller';
import { PlanaritySceneUIController } from './planarity-scene-ui-controller';

export class PlanarityScene {
  private sceneBase: PlanaritySceneBase;
  private selectionManager: PlanaritySceneSelectionManager;
  private renderController: PlanaritySceneRenderController;
  private interactionController: PlanaritySceneInteractionController;
  private historyManager: PlanaritySceneHistoryManager;
  private uiController: PlanaritySceneUIController;

  constructor(canvasElement: HTMLCanvasElement, updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void, updateUIGraphRepresentation: (graph: Graph) => void) {
    this.sceneBase = new PlanaritySceneBase(canvasElement);
    this.selectionManager = new PlanaritySceneSelectionManager();
    this.renderController = new PlanaritySceneRenderController(this.sceneBase, this.selectionManager);
    this.historyManager = new PlanaritySceneHistoryManager(this._undoAction.bind(this), this._redoAction.bind(this));
    this.uiController = new PlanaritySceneUIController(updateUIStatus, updateUIGraphRepresentation);
    this.interactionController = new PlanaritySceneInteractionController(this.sceneBase, this.selectionManager, this.renderController, this.historyManager, this.uiController);

    this.interactionController.renderGraphToUI([PLANARITY_SCENE_DEFAULT_GRAPH_RESULT], false, 250, true, false, true);
  }

  public clear(): void {
    const emptyGraph: Graph = { edges: [], nodes: [] };
    this.interactionController.renderGraphToUI([emptyGraph], false, 0, true, false, true);
  }

  private _undoAction(): void {
    this.selectionManager.deselectSelection();
    const graph = this.historyManager.getLast();
    this.interactionController.renderGraphToUI([graph], false, 0, false, true, false);
  }

  private _redoAction(): void {
    this.selectionManager.deselectSelection();
    const graph = this.historyManager.getLast();
    this.interactionController.renderGraphToUI([graph], false, 0, false, true, false);
  }

  public undo(): void {
    this.historyManager.undo();
  }

  public redo(): void {
    this.historyManager.redo();
  }

  public resize(w: number, h: number): void {
    return this.sceneBase.resize(w, h);
  }

  public update(): void {
    this.sceneBase.updateScene();
  }

  public getUIController(): PlanaritySceneUIController {
    return this.uiController;
  }

  public async loadGraph(graph: Graph, stepwise: boolean = true, millisecondsPerStep: number = 500): Promise<void> {
    this.uiController.updateStatus('Checking planarity...', 'info');

    try {
      const embeddingResult = await graphLayoutService.compute(
        graph.edges.map((edge): [number, number] => edge.value),
        graph.nodes.length
      );

      if (!embeddingResult.planar) {
        return this.uiController.updateStatus('Checking planarity... ✗', 'error');
      }

      this.uiController.updateStatus('Checking planarity... ✓ \n Computing planar drawing...', 'okay');

      const result = combinatorialEmbeddingToPosStepWise(graph.edges, embeddingResult.canonical_ordering);
      this.uiController.updateStatus('Checking planarity... ✓ \n Computing planar drawing... ✓', 'okay');

      this.interactionController.renderGraphToUI([...result.graphs], stepwise, millisecondsPerStep, true, true, true);
    } catch (err) {
      this.uiController.updateStatus(err instanceof Error ? err.message : 'Invalid input.', 'error');
    }
  }
}
