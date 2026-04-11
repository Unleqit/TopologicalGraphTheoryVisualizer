import { Box3, Group, Line, Mesh, Sphere, Vector3 } from 'three';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-scene-graph-rendering-result';
import { PlanaritySceneBase } from './planarity-scene-base';
import { PlanaritySceneSelectionManager } from './planarity-scene-selection-manager';
import { PlanaritySceneGraphEdge } from './types/planarity-scene-graph-edge';
import { PlanaritySceneGraphNode } from './types/planarity-scene-graph-node';
import { PlanaritySceneAnimationService } from './planarity-scene-animation-service';
import { Graph } from '../../graph/types/graph';
import { PlanaritySceneGraphRenderer } from './graph-renderer/planarity-scene-graph-renderer';

export class PlanaritySceneRenderController {
  private currentRendering: PlanarityPageGraphRenderingResult;
  private vertexMeshMap: Map<Mesh, PlanaritySceneGraphNode>;
  private edgeLineMap: Map<Line, PlanaritySceneGraphEdge>;
  private animationService: PlanaritySceneAnimationService;
  private graphRenderer: PlanaritySceneGraphRenderer;

  constructor(
    private readonly sceneBase: PlanaritySceneBase,
    private readonly selectionManager: PlanaritySceneSelectionManager
  ) {
    this.vertexMeshMap = new Map();
    this.edgeLineMap = new Map();
    this.currentRendering = { startTimestamp: 0, graph: { nodes: [], edges: [] }, graphGroup: new Group(), nodeMeshes: [], edgeLines: [] };
    this.animationService = new PlanaritySceneAnimationService(sceneBase, this);
    this.graphRenderer = new PlanaritySceneGraphRenderer();
  }

  public getCurrentRendering(): PlanarityPageGraphRenderingResult {
    return this.currentRendering;
  }

  public getVertexMeshMap(): Map<Mesh, PlanaritySceneGraphNode> {
    return this.vertexMeshMap;
  }

  public getEdgeLineMap(): Map<Line, PlanaritySceneGraphEdge> {
    return this.edgeLineMap;
  }

  public replaceRendering(_new: PlanarityPageGraphRenderingResult, recenter: boolean): void {
    if (this.currentRendering) {
      this.sceneBase.removeFromScene(this.currentRendering.graphGroup);
    }

    const box = new Box3().setFromObject(_new.graphGroup);
    const center = box.getCenter(new Vector3());

    if (recenter) {
      _new.graphGroup.position.sub(center);
    } else {
      _new.graphGroup.position.copy(this.currentRendering.graphGroup.position);
    }

    this.sceneBase.addToScene(_new.graphGroup);

    if (recenter) {
      const radius = box.getBoundingSphere(new Sphere()).radius;
      this.sceneBase.setCameraPosition(new Vector3(0, 0, radius * 3));
      this.sceneBase.getCamera().lookAt(0, 0, 0);
    }

    this.reapplySelection(_new);
    _new.graphGroup.visible = true;
    this.currentRendering = _new;
  }

  private reapplySelection(_new: PlanarityPageGraphRenderingResult): void {
    const [vertexSelectionId, edgeSelectionId] = this.selectionManager.getSelection().map((a) => a?.id ?? -1);
    const selectedVertex = _new.nodeMeshes.find((mesh) => mesh.id === vertexSelectionId);
    const selectedEdge = _new.edgeLines.find((line) => line.id === edgeSelectionId);
    if (selectedVertex) {
      this.selectionManager.selectVertex(selectedVertex);
    } else if (selectedEdge) {
      this.selectionManager.selectEdge(selectedEdge);
    }
  }

  public render(...graphs: Graph[]): PlanarityPageGraphRenderingResult[] {
    return this.graphRenderer.render([...graphs]);
  }

  public async applyRenderingResult(
    renderingResults: PlanarityPageGraphRenderingResult[],
    stepwise: boolean = false,
    stepDurationMs: number = 250,
    recenter: boolean = false,
    animate: boolean = false,
    animationDurationMs: number = 500
  ): Promise<void> {
    if (renderingResults.length === 0) {
      return;
    }

    //todo: idk what to do about this, disable it for now?
    stepwise = false;

    for (let i = stepwise ? 0 : renderingResults.length - 1; i < renderingResults.length; ++i) {
      const rendering = renderingResults[i];

      this.vertexMeshMap = new Map(rendering.nodeMeshes.map((n) => [n.mesh, n]));
      this.edgeLineMap = new Map(rendering.edgeLines.map((n) => [n.line, n]));

      if (animate) {
        this.animationService.animateTransition(this.currentRendering, rendering, animationDurationMs, recenter);
      } else {
        this.replaceRendering(rendering, recenter);
      }

      if (stepwise) {
        await new Promise((resolve) => setTimeout(resolve, stepDurationMs));
      }
    }
  }

  public async renderGraph(graphs: Graph[], stepwise: boolean, millisecondsPerStep: number, recenter: boolean, animate: boolean, animationDurationMs: number): Promise<void> {
    const renderingResult = this.render(...graphs);
    await this.applyRenderingResult(renderingResult, stepwise, millisecondsPerStep, recenter, animate, animationDurationMs);
  }
}
