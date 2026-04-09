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
  Color,
  LineBasicMaterial,
  SpriteMaterial,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera, createRenderer } from '../../pages/utils';
import { PlanaritySceneMouseHandler } from './interaction/planarity-scene-mouse-handler';
import { combinatorialEmbeddingToPosStepWise } from '../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { PlanarityPageStatusMode } from '../../pages/planarity-page/planarity-page-status-mode';
import { graphLayoutService } from './layout/index';
import { PlanarityPageGraphRenderer } from './graph-renderer/planarity-page-graph-renderer';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-page-graph-rendering-result';
import { PlanarityPageGraphNode } from './types/planarity-page-graph-node';
import { Graph } from '../../graph/types/graph';
import { PlanarityPageGraphBuilder } from './planarity-page-graph-builder';
import { PLANARITY_PAGE_DEFAULT_GRAPH_RESULT } from './planarity-page-default-graph';
import { GraphNode } from '../../graph/types/graph.node';
import { PlanarityPageGraphEdge } from './types/planarity-page-graph-edge';
import { GraphEdge } from '../../graph/types/graph-edge';

export class PlanarityScene {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private webglRenderer: WebGLRenderer;
  private mouseHandler: PlanaritySceneMouseHandler;
  private raycaster: Raycaster;
  private currentlySelectedVertex: PlanarityPageGraphNode | undefined;
  private currentlySelectedEdge: PlanarityPageGraphEdge | undefined;
  private history: Graph[];
  private historyIndex: number = -1;
  private updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void;
  private graphRenderer: PlanarityPageGraphRenderer;
  private vertexMeshMap: Map<Mesh, PlanarityPageGraphNode>;
  private edgeMeshMap: Map<Line, PlanarityPageGraphEdge>;
  private vertexIdMap: Map<number, PlanarityPageGraphNode>;
  private updateUIGraphRepresentation: (graph: Graph) => void;
  private graphBuilder: PlanarityPageGraphBuilder;
  private currentRendering: PlanarityPageGraphRenderingResult;

  constructor(canvasElement: HTMLCanvasElement, updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void, updateUIGraphRepresentation: (graph: Graph) => void) {
    this.webglRenderer = createRenderer(canvasElement);
    this.scene = new Scene();
    this.camera = createCamera();
    this.controls = new OrbitControls(this.camera, canvasElement);
    this.controls.enableZoom = true;
    this.controls.enableRotate = false;
    this.raycaster = new Raycaster();
    this.raycaster.params.Line.threshold = 0.3;
    this.updateUIStatus = updateUIStatus;
    this.updateUIGraphRepresentation = updateUIGraphRepresentation;
    this.graphRenderer = new PlanarityPageGraphRenderer();
    this.currentRendering = { startTimestamp: 0, graph: { nodes: [], edges: [] }, graphGroup: new Group(), nodeMeshes: [], edgeLines: [] };
    this.vertexMeshMap = new Map();
    this.edgeMeshMap = new Map();
    this.vertexIdMap = new Map();
    this.graphBuilder = new PlanarityPageGraphBuilder();
    this.history = [];

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
    const renderingResult = this.graphRenderer.render([PLANARITY_PAGE_DEFAULT_GRAPH_RESULT]);
    const latest = renderingResult[renderingResult.length - 1];
    this.commitToHistory();
    this.applyRenderingResult(renderingResult, false, 250, true, false);
  }

  public clear(): void {
    const emptyGraph: Graph = { edges: [], nodes: [] };
    this.commitToHistory(emptyGraph);
    const renderingResult = this.graphRenderer.render([emptyGraph]);
    renderingResult.forEach((result) => result.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(renderingResult, false);
  }

  private handleSelection(x: number, y: number): boolean {
    this.clone = this.graphBuilder.cloneGraph(this.currentRendering.graph);
    return this.checkIfAnyVertexSelected(x, y) || this.checkIfAnyEdgeSelected(x, y);
  }

  private handleDelete(): void {
    const last = this.getLastGraph();
    let newGraph: Graph;

    if (this.currentlySelectedVertex) {
      newGraph = this.graphBuilder.removeVertices(last, { id: this.currentlySelectedVertex.id, x: 0, y: 0 });
    } else if (this.currentlySelectedEdge) {
      newGraph = this.graphBuilder.removeEdges(last, {
        id: this.currentlySelectedEdge.id,
        value: this.currentlySelectedEdge.id.split(',').map((a) => Number(a)) as [number, number],
      });
    } else {
      return;
    }

    this.commitToHistory(newGraph);
    const renderingResult = this.graphRenderer.render([newGraph]);
    renderingResult[0].graphGroup.position.copy(this.currentRendering.graphGroup.position);
    this.applyRenderingResult(renderingResult, false);
  }

  private commitToHistory(...graphs: Graph[]): void {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(...graphs);
    this.historyIndex += graphs.length;
  }

  public undo(): void {
    if (this.historyIndex <= 0) {
      return;
    }

    this.historyIndex--;
    this.currentlySelectedVertex = undefined;
    this.currentlySelectedEdge = undefined;

    const graph = this.history[this.historyIndex];
    const rendering = this.graphRenderer.render([graph]);

    rendering.forEach((r) => r.graphGroup.position.copy(this.currentRendering.graphGroup.position));

    this.applyRenderingResult(rendering, false, 0, true, true);
  }

  public redo(): void {
    if (this.historyIndex >= this.history.length - 1) {
      return;
    }

    this.historyIndex++;
    this.currentlySelectedVertex = undefined;
    this.currentlySelectedEdge = undefined;

    const graph = this.history[this.historyIndex];
    const rendering = this.graphRenderer.render([graph]);

    rendering.forEach((r) => r.graphGroup.position.copy(this.currentRendering.graphGroup.position));

    this.applyRenderingResult(rendering, false, 0, true, true);
  }

  private getLastGraph(): Graph {
    return this.history[this.history.length - 1];
  }

  private handleCtrlClick(mouseX: number, mouseY: number): void {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);
    const intersects = this.raycaster.intersectObjects(this.currentRendering.graphGroup.children, true);

    if (this.currentlySelectedVertex) {
      for (const hit of intersects) {
        const hitVertex = hit.object as Mesh;
        const result = this.vertexMeshMap.get(hitVertex);
        if (result) {
          if (result !== this.currentlySelectedVertex) {
            return this.createNewEdge([result, this.currentlySelectedVertex]);
          } else {
            //do nothing, as creating an edge from and to the same vertex is illegal
          }
        }
      }
    } else {
      for (const hit of intersects) {
        const result = this.vertexMeshMap.get(hit.object as Mesh);
        if (result) {
          this.deselectVertex(this.currentlySelectedVertex);
          return this.selectVertex(result);
        }
      }

      for (const hit of intersects) {
        const result2 = this.edgeMeshMap.get(hit.object as Line);
        if (result2) {
          this.deselectEdge(this.currentlySelectedEdge);
          return this.selectEdge(result2);
        }
      }
    }
    this.createNewVertexInGraph(mouseX, mouseY);
  }

  private createNewEdge(vertexPair: [PlanarityPageGraphNode, PlanarityPageGraphNode]): void {
    const [v0, v1] = [vertexPair[0].id, vertexPair[1].id];
    const newGraph = this.graphBuilder.addEdges(this.currentRendering.graph, [v0, v1]);
    this.commitToHistory(newGraph);
    const rendering = this.graphRenderer.render([newGraph]);
    rendering.forEach((result) => result.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(rendering, false);
    this.deselectVertex(this.currentlySelectedVertex);
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
      this.vertexIdMap = new Map(rendering.nodeMeshes.map((n) => [n.id, n]));
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
    nodeIdMap: Map<number, PlanarityPageGraphNode>,
    node: PlanarityPageGraphNode,
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
    nodeIdMap: Map<number, PlanarityPageGraphNode>,
    node: PlanarityPageGraphNode,
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
    nodeIdMap: Map<number, PlanarityPageGraphNode>,
    node: PlanarityPageGraphNode,
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

    _new.graphGroup.visible = true;

    this.scene.add(_new.graphGroup);
    this.currentRendering = _new;
  }

  private updateVertices(graph: Graph, rendering: PlanarityPageGraphRenderingResult): void {
    const normal = new Vector3(0, 0, 1).applyQuaternion(rendering.graphGroup.quaternion);
    const point = rendering.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const hit = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) {
      return;
    }

    if (!this.currentlySelectedVertex) {
      return;
    }
    const local = rendering.graphGroup.worldToLocal(hit.clone());
    this.currentlySelectedVertex.mesh.position.copy(local);
    this.currentlySelectedVertex.label.position.copy(local);

    const selectedVertex = graph.nodes.find((v) => v.id === this.currentlySelectedVertex?.id);
    if (selectedVertex) {
      selectedVertex.x = local.x;
      selectedVertex.y = local.y;
    }
  }

  private updateEdges(rendering: PlanarityPageGraphRenderingResult): void {
    if (!this.history || !this.currentlySelectedVertex) {
      return;
    }

    const selectedId = Number(this.currentlySelectedVertex.id);
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
      this.commitToHistory(...commitGraphs);
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
      this.commitToHistory(this.clone);
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
    this.commitToHistory(newGraph);
    const newRenderingResult = this.graphRenderer.render([newGraph]);
    newRenderingResult.forEach((result) => result.graphGroup.position.copy(this.currentRendering.graphGroup.position));
    this.applyRenderingResult(newRenderingResult, false);
  }

  private checkIfAnyVertexSelected(mouseX: number, mouseY: number): boolean {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);

    const intersects = this.raycaster.intersectObjects(this.currentRendering.graphGroup.children, true);

    for (const hit of intersects) {
      const hitVertex = hit.object as Mesh;
      const result = this.vertexMeshMap.get(hitVertex);

      if (result) {
        this.deselectVertex(this.currentlySelectedVertex);
        this.deselectEdge(this.currentlySelectedEdge);
        this.selectVertex(result);
        return true;
      }
    }

    //user clicked in the void
    this.deselectVertex(this.currentlySelectedVertex);
    return false;
  }

  private checkIfAnyEdgeSelected(mouseX: number, mouseY: number): boolean {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);

    const intersects = this.raycaster.intersectObjects(this.currentRendering.graphGroup.children, true);

    for (const hit of intersects) {
      const hitEdge = hit.object as Line;
      const result = this.edgeMeshMap.get(hitEdge);

      if (result) {
        this.deselectVertex(this.currentlySelectedVertex);
        this.deselectEdge(this.currentlySelectedEdge);
        this.selectEdge(result);
        return true;
      }
    }

    //user clicked in the void
    this.deselectEdge(this.currentlySelectedEdge);
    return false;
  }

  private selectVertex(node: PlanarityPageGraphNode): void {
    this.currentlySelectedVertex = node;
    (node.mesh.material as MeshBasicMaterial).color.set(0xffff00);
  }

  private deselectVertex(node: PlanarityPageGraphNode | undefined): void {
    if (node) {
      (node.mesh.material as MeshBasicMaterial).color.set(0x1976d2);
      this.currentlySelectedVertex = undefined;
    }
  }

  private selectEdge(edge: PlanarityPageGraphEdge): void {
    this.currentlySelectedEdge = edge;
    const material = edge.line.material as LineBasicMaterial;
    if (!edge.line.userData.originalColor) {
      edge.line.userData.originalColor = material.color.clone();
    }

    material.color.set(0xffff00);
  }

  private deselectEdge(edge: PlanarityPageGraphEdge | undefined): void {
    if (edge) {
      const material = edge.line.material as LineBasicMaterial;
      const originalColor = edge.line.userData.originalColor as Color;
      if (originalColor) {
        material.color.copy(originalColor);
      }
      this.currentlySelectedEdge = undefined;
    }
  }
}
