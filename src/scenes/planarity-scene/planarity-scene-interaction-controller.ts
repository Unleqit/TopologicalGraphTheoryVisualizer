import { Vector2, Mesh, Line } from 'three';
import { PlanaritySceneRenderController } from './planarity-scene-render-controller';
import { PlanaritySceneGraphEdge } from './types/planarity-scene-graph-edge';
import { PlanaritySceneGraphNode } from './types/planarity-scene-graph-node';
import { PlanaritySceneBase } from './planarity-scene-base';
import { PlanaritySceneSelectionManager } from './planarity-scene-selection-manager';
import { PlanaritySceneMouseHandler } from './planarity-scene-mouse-handler';
import { Graph } from '../../graph/types/graph';
import { PlanaritySceneGraphBuilder } from './planarity-scene-graph-builder';
import { PlanaritySceneHistoryManager } from './planarity-scene-history-manager';
import { PlanaritySceneGeometryUpdater } from './planarity-scene-geometry-updater';
import { PlanaritySceneUIController } from './planarity-scene-ui-controller';
import { graphLayoutService } from './layout/index';

export class PlanaritySceneInteractionController {
  private mouseHandler: PlanaritySceneMouseHandler;
  private graphBuilder: PlanaritySceneGraphBuilder;
  private clone: Graph | undefined;
  private geometryUpdater: PlanaritySceneGeometryUpdater;

  constructor(
    private readonly sceneBase: PlanaritySceneBase,
    private readonly selectionManager: PlanaritySceneSelectionManager,
    private readonly renderController: PlanaritySceneRenderController,
    private readonly historyManager: PlanaritySceneHistoryManager,
    private readonly uiController: PlanaritySceneUIController
  ) {
    this.mouseHandler = new PlanaritySceneMouseHandler(
      this.sceneBase,
      this.handleCtrlClick.bind(this),
      this.handleSelection.bind(this),
      this.dragVertex.bind(this),
      this.releaseVertex.bind(this),
      this.handleDelete.bind(this)
    );
    this.graphBuilder = new PlanaritySceneGraphBuilder();
    this.geometryUpdater = new PlanaritySceneGeometryUpdater(this.sceneBase);
  }

  private handleCtrlClick(mouseX: number, mouseY: number): void {
    const vertexSelection = this.selectionManager.getVertexSelection();
    const [newVertexSelection, newEdgeSelection] = [this.checkIfAnyVertexSelected(mouseX, mouseY), this.checkIfAnyEdgeSelected(mouseX, mouseY)];

    if (vertexSelection && newVertexSelection && vertexSelection.id !== newVertexSelection.id) {
      this.selectionManager.selectVertex(newVertexSelection);
      this.createNewEdge([vertexSelection, newVertexSelection]);
    } else if (newVertexSelection) {
      this.selectionManager.selectVertex(newVertexSelection);
    } else if (newEdgeSelection) {
      this.selectionManager.selectEdge(newEdgeSelection);
    } else {
      this.createNewVertexInGraph(mouseX, mouseY);
    }
  }

  private handleSelection(x: number, y: number): boolean {
    this.clone = this.graphBuilder.cloneGraph(this.renderController.getCurrentRendering().graph);
    const newVertexSelection = this.checkIfAnyVertexSelected(x, y);
    const newEdgeSelection = this.checkIfAnyEdgeSelected(x, y);

    if (newVertexSelection) {
      this.selectionManager.selectVertex(newVertexSelection);
    } else if (newEdgeSelection) {
      this.selectionManager.selectEdge(newEdgeSelection);
    } else {
      this.selectionManager.deselectSelection();
    }

    return newVertexSelection !== undefined || newEdgeSelection !== undefined;
  }

  private createNewEdge(vertexPair: [PlanaritySceneGraphNode, PlanaritySceneGraphNode]): void {
    const [v0, v1] = [vertexPair[0].id, vertexPair[1].id];
    const newGraph = this.graphBuilder.addEdges(this.renderController.getCurrentRendering().graph, [v0, v1]);
    this.renderGraphToUI([newGraph], false, 0, false, false, 0, true);
    return;
  }

  private releaseVertex(): void {
    if (this.clone) {
      this.historyManager.commitToHistory(this.clone);
      const renderingResult = this.renderController.render(this.clone);
      this.renderController.applyRenderingResult(renderingResult, false, 0, false, false);
    }
  }

  private dragVertex(mouseX: number, mouseY: number): void {
    const vertex = this.selectionManager.getVertexSelection();
    const newPosWorld = this.sceneBase.getIntersectionPointInPlane(new Vector2(mouseX, mouseY), this.renderController.getCurrentRendering().graphGroup);

    if (!vertex || !newPosWorld || !this.clone) {
      return;
    }

    const newPosLocal = this.renderController.getCurrentRendering().graphGroup.worldToLocal(newPosWorld);
    this.geometryUpdater.updateVertexPosition(vertex, newPosLocal, this.clone, this.renderController.getCurrentRendering());
  }

  private createNewVertexInGraph(x: number, y: number): void {
    const vertex = this.sceneBase.getIntersectionPointInPlane(new Vector2(x, y), this.renderController.getCurrentRendering().graphGroup);
    if (!vertex) {
      return;
    }

    const localVertex = this.renderController.getCurrentRendering().graphGroup.worldToLocal(vertex.clone());
    const newGraph = this.graphBuilder.addVertices(this.renderController.getCurrentRendering().graph, localVertex);
    this.renderGraphToUI([newGraph], false, 0, false, true, 300, true);
  }

  private handleDelete(): void {
    const last = this.historyManager.getLast();
    let newGraph: Graph;
    const [vertexSelection, edgeSelection] = this.selectionManager.getSelection();

    if (vertexSelection) {
      newGraph = this.graphBuilder.removeVertices(last, { id: vertexSelection.id, x: 0, y: 0 });
    } else if (edgeSelection) {
      newGraph = this.graphBuilder.removeEdges(last, { id: edgeSelection.id, value: edgeSelection.id.split(',').map((a) => Number(a)) as [number, number] });
    } else {
      return;
    }

    this.historyManager.commitToHistory(newGraph);
    this.renderGraphToUI([newGraph], false, 0, false, true, 200, true);
  }

  public async renderGraphToUI(
    graphs: Graph[],
    stepwise: boolean,
    millisecondsPerStep: number,
    recenter: boolean,
    animate: boolean,
    animationDurationMs: number,
    commitToHistory: boolean
  ): Promise<void> {
    const lastGraph = graphs[graphs.length - 1];

    if (commitToHistory) {
      this.historyManager.commitToHistory(lastGraph);
    }

    this.renderController.renderGraph(graphs, stepwise, millisecondsPerStep, recenter, animate, animationDurationMs);
    this.uiController.updateGraphRepresentation(lastGraph);

    if (lastGraph.nodes.length > 0) {
      const embeddingResult = await graphLayoutService.compute(
        lastGraph.edges.map((edge): [number, number] => edge.value),
        lastGraph.nodes.length
      );

      if (!embeddingResult.planar) {
        this.uiController.updateStatus('Checking planarity... ✗', 'error');
      } else {
        this.uiController.updateStatus('Checking planarity... ✓', 'okay');
      }
    } else {
      this.uiController.updateStatus('', 'info');
    }
  }

  public checkIfAnyVertexSelected(mouseX: number, mouseY: number): PlanaritySceneGraphNode | undefined {
    const intersects = this.sceneBase.getIntersectionsForGroup(new Vector2(mouseX, mouseY), this.renderController.getCurrentRendering().graphGroup.children);

    for (const hit of intersects) {
      const hitVertexMesh = hit.object as Mesh;
      const result = this.renderController.getVertexMeshMap().get(hitVertexMesh);
      if (result) {
        return result;
      }
    }

    return undefined;
  }

  public checkIfAnyEdgeSelected(mouseX: number, mouseY: number): PlanaritySceneGraphEdge | undefined {
    const intersects = this.sceneBase.getIntersectionsForGroup(new Vector2(mouseX, mouseY), this.renderController.getCurrentRendering().graphGroup.children);

    for (const hit of intersects) {
      const hitEdgeLine = hit.object as Line;
      const result = this.renderController.getEdgeLineMap().get(hitEdgeLine);
      if (result) {
        return result;
      }
    }

    return undefined;
  }
}
