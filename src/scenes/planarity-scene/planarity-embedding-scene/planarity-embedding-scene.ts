import { Graph } from '../../../graph/types/graph';
import { PlanarityConditionInteractionController } from '../planarity-condition-scene/planarity-condition-interaction-controller';
import { PlanaritySceneBase } from '../planarity-editor-scene/planarity-scene-base';
import { PlanaritySceneHistoryManager } from '../planarity-editor-scene/planarity-scene-history-manager';
import { PlanaritySceneRenderController } from '../planarity-editor-scene/planarity-scene-render-controller';
import { PlanaritySceneSelectionManager } from '../planarity-editor-scene/planarity-scene-selection-manager';
import { PlanaritySceneUIController } from '../planarity-editor-scene/planarity-scene-ui-controller';
import { GraphEmbeddingPythonResult } from '../../../graph/types/graph-embedding-python-result';
import { combinatorialEmbeddingToPosStepWise } from '../../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { Vector3 } from 'three';
import { GraphNode } from '../../../graph/types/graph.node';
import { GraphEdge } from '../../../graph/types/graph-edge';
import { PlanarityEmbeddingInteractionController } from './planarity-embedding-interaction-controller';

export class PlanarityEmbeddingScene extends PlanaritySceneBase {
  private selectionManager: PlanaritySceneSelectionManager;
  private renderController: PlanaritySceneRenderController;
  private interactionController: PlanarityEmbeddingInteractionController;
  private historyManager: PlanaritySceneHistoryManager;
  private uiController: PlanaritySceneUIController;
  private steps: Graph[] = [];

  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement);
    this.controls.enabled = false;

    this.selectionManager = new PlanaritySceneSelectionManager();
    this.renderController = new PlanaritySceneRenderController(this, this.selectionManager);
    this.historyManager = new PlanaritySceneHistoryManager(this._undoAction.bind(this), this._redoAction.bind(this));
    this.uiController = new PlanaritySceneUIController(
      () => {},
      () => {}
    );
    this.interactionController = new PlanarityEmbeddingInteractionController(this, this.selectionManager, this.renderController, this.historyManager, this.uiController);

    const graph = PLANARITY_EMBEDDING_SCENE_GRAPH;
    const renderingResult = this.renderController.render(graph);

    this.renderController.applyRenderingResult(renderingResult, false, 250, true, false);
    this.uiController.updateStatus('Checking planarity... ✓', 'okay');
    this.historyManager.commitToHistory(graph);

    const embeddingResult: GraphEmbeddingPythonResult = JSON.parse(`{"planar":true,"canonical_ordering":[[1,[]],[5,[]],[4,[1,5]],[2,[1,4]],[0,[1,2]],[6,[4,5]],[3,[1,0,2,4]]]}`);
    const straightLineDrawingSteps = combinatorialEmbeddingToPosStepWise(graph.edges, embeddingResult.canonical_ordering);

    //patch graph steps
    const currentGraph = this.cloneGraph(graph);
    for (const step of [straightLineDrawingSteps.graphs.at(-1)!]) {
      const stepMap = new Map(step.nodes.map((n) => [n.id, n]));
      const changedNodes = currentGraph.nodes.filter((node) => {
        const target = stepMap.get(node.id);
        return target && (node.x !== target.x || node.y !== target.y);
      });

      for (const changedNode of changedNodes) {
        const target = stepMap.get(changedNode.id)!;
        const nodeInCurrent = currentGraph.nodes.find((n) => n.id === changedNode.id)!;
        nodeInCurrent.x = target.x;
        nodeInCurrent.y = target.y;
        this.steps.push(this.cloneGraph(currentGraph));
      }
    }
  }

  private cloneGraph(graph: Graph): Graph {
    return {
      nodes: graph.nodes.map((node): GraphNode => ({ id: node.id, x: node.x, y: node.y })),
      edges: graph.edges.map((edge): GraphEdge => ({ id: edge.id, value: edge.id.split(',').map(Number) as [number, number] })),
    };
  }

  public override startAnimation(startPos?: Vector3): void {
    super.startAnimation(startPos);
    this.interactionController.renderGraphToUI([...this.steps], true, 200, true, true, 2000, true);
  }
  private _undoAction(): void {
    this.selectionManager.deselectSelection();
    const graph = this.historyManager.getLast();
    this.interactionController.renderGraphToUI([graph], false, 0, false, true, 500, false);
  }

  private _redoAction(): void {
    this.selectionManager.deselectSelection();
    const graph = this.historyManager.getLast();
    this.interactionController.renderGraphToUI([graph], false, 0, false, true, 500, false);
  }
}

const PLANARITY_EMBEDDING_SCENE_GRAPH: Graph = JSON.parse(
  `{"nodes":[{"id":0,"x":5.7052399609598625,"y":5.04315941568175},{"id":1,"x":6,"y":0},{"id":2,"x":-0.42323920556036887,"y":1.9324074332434922},{"id":3,"x":3.6538121978509848,"y":1.8162382720735988},{"id":4,"x":3,"y":3},{"id":5,"x":4.698879171510225,"y":2.2292841784554422},{"id":6,"x":2.399609124945597,"y":-0.4321479987432424}],"edges":[{"id":"0,1","value":[0,1]},{"id":"0,2","value":[0,2]},{"id":"0,3","value":[0,3]},{"id":"1,2","value":[1,2]},{"id":"2,3","value":[2,3]},{"id":"2,4","value":[2,4]},{"id":"3,4","value":[3,4]},{"id":"4,6","value":[4,6]},{"id":"5,6","value":[5,6]},{"id":"1,3","value":[1,3]},{"id":"4,5","value":[4,5]},{"id":"1,5","value":[1,5]}]}`
);
