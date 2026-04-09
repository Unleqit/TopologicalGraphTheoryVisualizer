import {
  Group,
  PerspectiveCamera,
  Vector3,
  Mesh,
  MeshBasicMaterial,
  Scene,
  AmbientLight,
  DirectionalLight,
  Plane,
  Raycaster,
  Vector2,
  WebGLRenderer,
  Box3,
  Sphere,
  Line,
  SpriteMaterial,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera, createRenderer } from '../../pages/utils';
import { PlanaritySceneMouseHandler } from './planarity-scene-mouse-handler';
import { combinatorialEmbeddingToPosStepWise } from '../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { PlanarityPageStatusMode } from '../../pages/planarity-page/planarity-page-status-mode';
import { graphLayoutService } from './layout/index';
import { Graph } from '../../graph/types/graph';
import { GraphNode } from '../../graph/types/graph.node';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-scene-graph-rendering-result';
import { PlanaritySceneGraphEdge } from './types/planarity-scene-graph-edge';
import { PlanaritySceneGraphNode } from './types/planarity-scene-graph-node';
import { PLANARITY_SCENE_DEFAULT_GRAPH_RESULT } from './planarity-scene-default-graph';
import { PlanaritySceneGraphRenderer } from './graph-renderer/planarity-scene-graph-renderer';
import { PlanaritySceneGraphBuilder } from './planarity-scene-graph-builder';
import { PlanaritySceneHistoryManager } from './planarity-scene-history-manager';
import { PlanaritySceneSelectionManager } from './planarity-scene-selection-manager';

export class PlanarityScene {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private webglRenderer: WebGLRenderer;
  private mouseHandler: PlanaritySceneMouseHandler;
  private raycaster: Raycaster;

  private graphRenderer: PlanaritySceneGraphRenderer;
  private vertexMeshMap: Map<Mesh, PlanaritySceneGraphNode>;
  private edgeMeshMap: Map<Line, PlanaritySceneGraphEdge>;
  private graphBuilder: PlanaritySceneGraphBuilder;
  private currentRendering: PlanarityPageGraphRenderingResult;
  private historyManager: PlanaritySceneHistoryManager;
  private selectionManager: PlanaritySceneSelectionManager;

  constructor(
    private readonly canvasElement: HTMLCanvasElement,
    private readonly updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void,
    private readonly updateUIGraphRepresentation: (graph: Graph) => void
  ) {
    this.webglRenderer = createRenderer(canvasElement);
    this.scene = new Scene();
    this.camera = createCamera();
    this.controls = new OrbitControls(this.camera, canvasElement);
    this.controls.enableZoom = true;
    this.controls.enableRotate = false;
    this.raycaster = new Raycaster();
    this.raycaster.params.Line.threshold = 0.3;
    this.graphRenderer = new PlanaritySceneGraphRenderer();
    this.currentRendering = { startTimestamp: 0, graph: { nodes: [], edges: [] }, graphGroup: new Group(), nodeMeshes: [], edgeLines: [] };
    this.vertexMeshMap = new Map();
    this.edgeMeshMap = new Map();
    this.graphBuilder = new PlanaritySceneGraphBuilder();
    this.historyManager = new PlanaritySceneHistoryManager(this._undoAction.bind(this), this._redoAction.bind(this));
    this.selectionManager = new PlanaritySceneSelectionManager();

    this.mouseHandler = new PlanaritySceneMouseHandler(
      this.camera,
      canvasElement,
      this.handleCtrlClick.bind(this),
      this.handleSelection.bind(this),
      this.dragVertex.bind(this),
      this.releaseVertex.bind(this),
      this.handleDelete.bind(this)
    );

    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);

    //render default graph at start
    const renderingResult = this.graphRenderer.render([PLANARITY_SCENE_DEFAULT_GRAPH_RESULT]);
    this.historyManager.commitToHistory(renderingResult[renderingResult.length - 1].graph);
    this.applyRenderingResult(renderingResult, false, 250, true, false);
  }

  public clear(): void {
    const emptyGraph: Graph = { edges: [], nodes: [] };
    this.historyManager.commitToHistory(emptyGraph);
    const renderingResult = this.graphRenderer.render([emptyGraph]);
    renderingResult.forEach((result) => result.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(renderingResult, false);
  }

  private handleCtrlClick(mouseX: number, mouseY: number): void {
    const vertexSelection = this.selectionManager.getVertexSelection();
    const [newVertexSelection, newEdgeSelection] = [this.checkIfAnyVertexSelected(mouseX, mouseY), this.checkIfAnyEdgeSelected(mouseX, mouseY)];

    if (vertexSelection && newVertexSelection && vertexSelection.id !== newVertexSelection.id) {
      this.selectionManager.selectVertex(newVertexSelection);
      return this.createNewEdge([vertexSelection, newVertexSelection]);
    } else if (newVertexSelection) {
      return this.selectionManager.selectVertex(newVertexSelection);
    } else if (newEdgeSelection) {
      return this.selectionManager.selectEdge(newEdgeSelection);
    } else {
      this.createNewVertexInGraph(mouseX, mouseY);
    }
  }

  private handleSelection(x: number, y: number): boolean {
    this.clone = this.graphBuilder.cloneGraph(this.currentRendering.graph);
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
    const renderingResult = this.graphRenderer.render([newGraph]);
    renderingResult[0].graphGroup.position.copy(this.currentRendering.graphGroup.position);
    this.applyRenderingResult(renderingResult, false);
  }

  private _undoAction(): void {
    this.selectionManager.deselectSelection();
    const graph = this.historyManager.getLast();
    const rendering = this.graphRenderer.render([graph]);
    rendering.forEach((r) => r.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(rendering, false, 0, true, true);
  }

  private _redoAction(): void {
    this.selectionManager.deselectSelection();
    const graph = this.historyManager.getLast();
    const rendering = this.graphRenderer.render([graph]);
    rendering.forEach((r) => r.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(rendering, false, 0, true, true);
  }

  public undo(): void {
    this.historyManager.undo();
  }

  public redo(): void {
    this.historyManager.redo();
  }

  private createNewEdge(vertexPair: [PlanaritySceneGraphNode, PlanaritySceneGraphNode]): void {
    const [v0, v1] = [vertexPair[0].id, vertexPair[1].id];
    const newGraph = this.graphBuilder.addEdges(this.currentRendering.graph, [v0, v1]);
    this.historyManager.commitToHistory(newGraph);
    const rendering = this.graphRenderer.render([newGraph]);
    rendering.forEach((result) => result.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(rendering, false);
    return;
  }

  private async applyRenderingResult(
    renderingResults: PlanarityPageGraphRenderingResult[],
    stepwise: boolean = false,
    millisecondsPerStep: number = 250,
    recenter: boolean = false,
    animate: boolean = false
  ): Promise<void> {
    if (renderingResults.length === 0) {
      return;
    }

    //todo: idk what to do about this, disable it for now?
    stepwise = false;

    for (let i = stepwise ? 0 : renderingResults.length - 1; i < renderingResults.length; ++i) {
      const rendering = renderingResults[i];

      this.vertexMeshMap = new Map(rendering.nodeMeshes.map((n) => [n.mesh, n]));
      this.edgeMeshMap = new Map(rendering.edgeLines.map((n) => [n.line, n]));

      if (animate) {
        this.animateTransition(this.currentRendering, rendering, 500, recenter);
      } else {
        this.replaceRendering(rendering, recenter);
      }

      if (stepwise) {
        await new Promise((resolve) => setTimeout(resolve, millisecondsPerStep));
      }
    }

    const lastGraph = renderingResults[renderingResults.length - 1].graph;
    this.updateUIGraphRepresentation(lastGraph);

    if (lastGraph.nodes.length > 0) {
      const embeddingResult = await graphLayoutService.compute(
        lastGraph.edges.map((edge): [number, number] => edge.value),
        lastGraph.nodes.length
      );

      if (!embeddingResult.planar) {
        this.updateUIStatus('Checking planarity... ✗', 'error');
      } else {
        this.updateUIStatus('Checking planarity... ✓', 'okay');
      }
    } else {
      this.updateUIStatus('', 'info');
    }
  }

  private animateTransition(old: PlanarityPageGraphRenderingResult | undefined, _new: PlanarityPageGraphRenderingResult, msTotal: number, recenter: boolean = false): void {
    // Create a map of nodes with their old positions
    const newMap = new Map(_new.graph.nodes.map((node) => [node.id, node]));
    if (!old) {
      old = _new;
    }

    const oldMap = old.graph.nodes.length > 0 ? new Map(old.graph.nodes.map((node) => [node.id, node])) : newMap;
    const startTime = performance.now();
    const oldMeshMap = new Map(old.nodeMeshes.map((nodeMesh) => [nodeMesh.id, nodeMesh]));

    const animate = () => {
      const now = performance.now();
      const elapsedTime = now - startTime;
      const progress = Math.min(elapsedTime / msTotal, 1);
      const oldGraphGroup = old.graph.nodes.length === 0 && old.graph.edges.length === 0 ? _new.graphGroup : old.graphGroup;

      old.graph.nodes.forEach((node) => {
        const nodeInOldRendering = oldMap.get(node.id);
        const nodeInNewRendering = newMap.get(node.id);
        const nodeMeshInOldRendering = oldMeshMap.get(node.id)!;

        if (nodeInOldRendering && nodeInNewRendering) {
          this.animateTransitionBetweenExistingVertices(
            old,
            oldMap,
            oldMeshMap,
            nodeMeshInOldRendering,
            [nodeInOldRendering.x - nodeInNewRendering.x, nodeInOldRendering.y - nodeInNewRendering.y],
            progress
          );
        } else if (nodeInOldRendering) {
          this.animateTransitionRemoveOldVertex(old, oldMap, oldMeshMap, nodeMeshInOldRendering, progress);
        } else if (nodeInNewRendering) {
          this.animateTransitionCreateNewVertex(old, oldMap, oldMeshMap, nodeMeshInOldRendering, progress);
        }
      });

      if (recenter) {
        this.camera.position.copy(this.centerGroup(oldGraphGroup));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.replaceRendering(_new, recenter);
        _new.graphGroup.position.copy(old.graphGroup.position);
      }
    };

    animate();
  }

  private animateTransitionBetweenExistingVertices(
    rendering: PlanarityPageGraphRenderingResult,
    oldMap: Map<number, GraphNode>,
    nodeIdMap: Map<number, PlanaritySceneGraphNode>,
    node: PlanaritySceneGraphNode,
    offset: [number, number],
    progress: number
  ): void {
    node.mesh.position.x = node.label.position.x = oldMap.get(node.id)!.x - offset[0] * progress;
    node.mesh.position.y = node.label.position.y = oldMap.get(node.id)!.y - offset[1] * progress;

    rendering.edgeLines.forEach((edge) => {
      const [aIndex, bIndex] = (edge.id as string).split(',').map(Number);

      if (aIndex !== node.id && bIndex !== node.id) {
        return;
      }

      const nodeA = nodeIdMap.get(aIndex)!.mesh;
      const nodeB = nodeIdMap.get(bIndex)!.mesh;

      if (!nodeA || !nodeB) {
        return;
      }

      const posAttr = edge.line.geometry.getAttribute('position');

      posAttr.setXYZ(0, nodeA.position.x, nodeA.position.y, nodeA.position.z);
      posAttr.setXYZ(1, nodeB.position.x, nodeB.position.y, nodeB.position.z);
      posAttr.needsUpdate = true;
    });
  }

  private animateTransitionRemoveOldVertex(
    rendering: PlanarityPageGraphRenderingResult,
    oldMap: Map<number, GraphNode>,
    nodeIdMap: Map<number, PlanaritySceneGraphNode>,
    node: PlanaritySceneGraphNode,
    progress: number
  ): void {
    // Use the progress to scale down the old vertex size (for fade out effect)
    const tmp = oldMap.get(node.id)!;
    const initialPosition = new Vector3(tmp.x, tmp.y, 0);
    node.mesh.position.lerp(initialPosition, 1 - progress);
    node.label.position.lerp(initialPosition, 1 - progress);

    // Gradually fade out the vertex
    (node.mesh.material as MeshBasicMaterial).opacity = 1 - progress;
    (node.label.material as SpriteMaterial).opacity = 1 - progress;

    // If progress reaches 100%, remove the vertex from the scene
    if (progress === 1) {
      node.mesh.visible = false;
      node.label.visible = false;
    }
  }

  private animateTransitionCreateNewVertex(
    rendering: PlanarityPageGraphRenderingResult,
    oldMap: Map<number, GraphNode>,
    nodeIdMap: Map<number, PlanaritySceneGraphNode>,
    node: PlanaritySceneGraphNode,
    progress: number
  ): void {
    // Interpolate the new vertex position from the origin (or any other starting point) to the final position
    const initialPosition = new Vector3(0, 0, 0); // Assuming the new vertex starts at the origin
    const targetPosition = nodeIdMap.get(node.id)!.mesh.position;

    node.mesh.position.lerpVectors(initialPosition, targetPosition, progress);
    node.label.position.lerpVectors(initialPosition, targetPosition, progress);

    // Gradually fade in the new vertex and its label
    (node.mesh.material as MeshBasicMaterial).opacity = progress;
    (node.label.material as SpriteMaterial).opacity = progress;

    // If progress reaches 100%, make the vertex fully visible
    if (progress === 1) {
      node.mesh.visible = true;
      node.label.visible = true;
    }
  }

  private replaceRendering(_new: PlanarityPageGraphRenderingResult, recenter: boolean): void {
    if (this.currentRendering) {
      this.scene.remove(this.currentRendering.graphGroup);
    }
    if (recenter) {
      this.camera.position.copy(this.centerGroup(_new.graphGroup));
    }

    this.reapplySelection(_new);
    _new.graphGroup.visible = true;

    this.scene.add(_new.graphGroup);
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

  private updateVertices(graph: Graph, rendering: PlanarityPageGraphRenderingResult): void {
    const normal = new Vector3(0, 0, 1).applyQuaternion(rendering.graphGroup.quaternion);
    const point = rendering.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const hit = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) {
      return;
    }

    const vertexSelection = this.selectionManager.getVertexSelection();
    if (!vertexSelection) {
      return;
    }
    const local = rendering.graphGroup.worldToLocal(hit.clone());
    vertexSelection.mesh.position.copy(local);
    vertexSelection.label.position.copy(local);

    const selectedVertex = graph.nodes.find((v) => v.id === vertexSelection?.id);
    if (selectedVertex) {
      selectedVertex.x = local.x;
      selectedVertex.y = local.y;
    }
  }

  private updateEdges(rendering: PlanarityPageGraphRenderingResult): void {
    const vertexSelection = this.selectionManager.getVertexSelection();
    if (!vertexSelection) {
      return;
    }

    const selectedId = Number(vertexSelection.id);
    const nodeIdMap = new Map(rendering.nodeMeshes.map((nodeMesh) => [nodeMesh.id, nodeMesh]));

    rendering.edgeLines.forEach((edge) => {
      const [aIndex, bIndex] = (edge.id as string).split(',').map(Number);

      if (aIndex !== selectedId && bIndex !== selectedId) {
        return;
      }

      const nodeA = nodeIdMap.get(aIndex)!.mesh;
      const nodeB = nodeIdMap.get(bIndex)!.mesh;

      if (!nodeA || !nodeB) {
        return;
      }

      const posAttr = edge.line.geometry.getAttribute('position');

      posAttr.setXYZ(0, nodeA.position.x, nodeA.position.y, nodeA.position.z);
      posAttr.setXYZ(1, nodeB.position.x, nodeB.position.y, nodeB.position.z);
      posAttr.needsUpdate = true;
    });
  }

  public resize(w: number, h: number): void {
    this.webglRenderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  public async loadGraph(graph: Graph, stepwise: boolean = true, millisecondsPerStep: number = 500): Promise<void> {
    this.updateUIStatus('Checking planarity...', 'info');

    try {
      const embeddingResult = await graphLayoutService.compute(
        graph.edges.map((edge): [number, number] => edge.value),
        graph.nodes.length
      );

      if (!embeddingResult.planar) {
        return this.updateUIStatus('Checking planarity... ✗', 'error');
      }

      this.updateUIStatus('Checking planarity... ✓ \n Computing planar drawing...', 'okay');

      const result = combinatorialEmbeddingToPosStepWise(graph.edges, embeddingResult.canonical_ordering);
      this.updateUIStatus('Checking planarity... ✓ \n Computing planar drawing... ✓', 'okay');

      const renderingResult = this.graphRenderer.render(result.graphs);
      const commitGraphs = stepwise ? (result.graphs.length > 0 ? [result.graphs[result.graphs.length - 1]] : []) : result.graphs;
      this.historyManager.commitToHistory(...commitGraphs);
      this.applyRenderingResult(renderingResult, stepwise, millisecondsPerStep, true, true);
    } catch (err) {
      this.updateUIStatus(err instanceof Error ? err.message : 'Invalid input.', 'error');
    }
  }

  public update(): void {
    this.controls.update();
    this.webglRenderer.render(this.scene, this.camera);
  }

  private clone: Graph | undefined;

  private releaseVertex(): void {
    if (this.clone) {
      this.historyManager.commitToHistory(this.clone);
      const renderingResult = this.graphRenderer.render([this.clone]);
      renderingResult[0].graphGroup.position.copy(this.currentRendering.graphGroup.position);
      this.applyRenderingResult(renderingResult, false, 0, false, false);
    }
  }

  private dragVertex(mouseX: number, mouseY: number): void {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);
    this.updateVertices(this.clone!, this.currentRendering);
    this.updateEdges(this.currentRendering);
  }

  protected centerGroup(group: Group): Vector3 {
    const box = new Box3().setFromObject(group);
    const sphere = box.getBoundingSphere(new Sphere());
    group.position.sub(sphere.center);
    return new Vector3(0, 0, sphere.radius * 3);
  }

  private createNewVertexInGraph(x: number, y: number): void {
    this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
    const normal = new Vector3(0, 0, 1).applyQuaternion(this.currentRendering.graphGroup.quaternion);
    const point = this.currentRendering.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const vertex = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, vertex)) {
      return;
    }
    const localVertex = this.currentRendering.graphGroup.worldToLocal(vertex.clone());
    const newGraph = this.graphBuilder.addVertices(this.currentRendering.graph, localVertex);
    this.historyManager.commitToHistory(newGraph);
    const newRenderingResult = this.graphRenderer.render([newGraph]);
    newRenderingResult.forEach((result) => result.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(newRenderingResult, false);
  }

  private checkIfAnyVertexSelected(mouseX: number, mouseY: number): PlanaritySceneGraphNode | undefined {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);
    const intersects = this.raycaster.intersectObjects(this.currentRendering.graphGroup.children, true);

    for (const hit of intersects) {
      const hitVertex = hit.object as Mesh;
      const result = this.vertexMeshMap.get(hitVertex);

      if (result) {
        return result;
      }
    }

    return undefined;
  }

  private checkIfAnyEdgeSelected(mouseX: number, mouseY: number): PlanaritySceneGraphEdge | undefined {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);

    const intersects = this.raycaster.intersectObjects(this.currentRendering.graphGroup.children, true);

    for (const hit of intersects) {
      const hitEdge = hit.object as Line;
      const result = this.edgeMeshMap.get(hitEdge);

      if (result) {
        return result;
      }
    }

    return undefined;
  }
}
