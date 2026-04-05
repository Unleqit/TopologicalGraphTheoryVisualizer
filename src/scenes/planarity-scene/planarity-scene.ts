import { Group, PerspectiveCamera, Vector3, Mesh, MeshBasicMaterial, Scene, AmbientLight, DirectionalLight, Plane, Raycaster, Vector2, WebGLRenderer, Box3, Sphere } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera, createRenderer } from '../../pages/utils';
import { PlanaritySceneMouseHandler } from './interaction/planarity-scene-mouse-handler';
import { combinatorialEmbeddingToPosStepWise } from '../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { PlanarityPageInputConverter } from '../../pages/planarity-page/input-handling/planarity-page-input-converter';
import { PlanarityPageStatusMode } from '../../pages/planarity-page/planarity-page-status-mode';
import { graphLayoutService } from './layout/index';
import { PlanarityPageGraphRenderer } from './graph-renderer/planarity-page-graph-renderer';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-page-graph-rendering-result';
import { PlanarityPageGraphNode } from './types/planarity-page-graph-node';
import { Graph } from '../../graph/types/graph';
import { PlanarityPageGraphBuilder } from './planarity-page-graph-builder';
import { PLANARITY_PAGE_DEFAULT_GRAPH_RESULT } from './planarity-page-default-graph';

export class PlanarityScene {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private webglRenderer: WebGLRenderer;
  private mouseHandler: PlanaritySceneMouseHandler;
  private raycaster: Raycaster;
  private currentlySelectedVertex: PlanarityPageGraphNode | undefined;
  private lastRenderingResult: PlanarityPageGraphRenderingResult[];
  private updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void;
  private graphRenderer: PlanarityPageGraphRenderer;
  private vertexMeshMap: Map<Mesh, PlanarityPageGraphNode>;
  private vertexIdMap: Map<number, PlanarityPageGraphNode>;
  private updateUIGraphRepresentation: (graph: Graph) => void;
  private graphBuilder: PlanarityPageGraphBuilder;

  constructor(canvasElement: HTMLCanvasElement, updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void, updateUIGraphRepresentation: (graph: Graph) => void) {
    this.webglRenderer = createRenderer(canvasElement);
    this.scene = new Scene();
    this.camera = createCamera();
    this.controls = new OrbitControls(this.camera, canvasElement);
    this.controls.enableZoom = true;
    this.controls.enableRotate = false;
    this.raycaster = new Raycaster();
    this.updateUIStatus = updateUIStatus;
    this.updateUIGraphRepresentation = updateUIGraphRepresentation;
    this.graphRenderer = new PlanarityPageGraphRenderer();
    this.lastRenderingResult = [{ startTimestamp: 0, graph: { nodes: [], edges: [] }, graphGroup: new Group(), nodeMeshes: [], edgeLines: [] }];
    this.scene.add(this.getLastRenderingResult().graphGroup);
    this.vertexMeshMap = new Map();
    this.vertexIdMap = new Map();
    this.graphBuilder = new PlanarityPageGraphBuilder();

    this.mouseHandler = new PlanaritySceneMouseHandler(
      this.camera,
      canvasElement,
      this.handleCtrlClick.bind(this),
      this.checkIfAnyVertexSelected.bind(this),
      this.dragVertex.bind(this),
      this.releaseVertex.bind(this)
    );

    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);

    //render default graph at start
    const renderingResult = this.graphRenderer.render([PLANARITY_PAGE_DEFAULT_GRAPH_RESULT]);
    this.applyRenderingResult(renderingResult, true, 250);
  }

  private getLastRenderingResult(): PlanarityPageGraphRenderingResult {
    return this.lastRenderingResult[this.lastRenderingResult.length - 1];
  }

  private handleCtrlClick(mouseX: number, mouseY: number): void {
    const lastRenderingResult = this.getLastRenderingResult();
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);
    const intersects = this.raycaster.intersectObjects(lastRenderingResult.graphGroup.children, true);

    if (this.currentlySelectedVertex) {
      for (const hit of intersects) {
        const hitVertex = hit.object as Mesh;
        const result = this.vertexMeshMap.get(hitVertex);
        if (result) {
          const newGraph = this.graphBuilder.addEdges(lastRenderingResult, [this.currentlySelectedVertex, result]);
          const newRenderingResult = this.graphRenderer.render([newGraph]);
          this.applyRenderingResult(newRenderingResult, false);
          this.deselectVertex(this.currentlySelectedVertex);
          return;
        }
      }
    }

    this.createNewVertexInGraph(mouseX, mouseY);
  }

  private async applyRenderingResult(renderingResult: PlanarityPageGraphRenderingResult[], stepwise: boolean = true, millisecondsPerStep: number = 250): Promise<void> {
    let lastRenderingResult = this.getLastRenderingResult();

    for (let i = stepwise ? 0 : renderingResult.length - 1; i < renderingResult.length; ++i) {
      const rendering = renderingResult[i];
      this.vertexMeshMap = new Map(rendering.nodeMeshes.map((node) => [node.mesh, node]));
      this.vertexIdMap = new Map(rendering.nodeMeshes.map((node) => [node.id, node]));
      rendering.graphGroup.visible = true;
      this.scene.remove(lastRenderingResult.graphGroup);
      if (stepwise) {
        this.camera.position.copy(this.centerGroup(rendering.graphGroup));
      } else {
        rendering.graphGroup.position.copy(lastRenderingResult.graphGroup.position);
      }
      this.scene.add(rendering.graphGroup);
      lastRenderingResult = rendering;
      this.lastRenderingResult.push(rendering);
      await new Promise((resolve) => setTimeout(resolve, millisecondsPerStep));
    }

    //push any changes back to UI
    this.updateUIGraphRepresentation(renderingResult[renderingResult.length - 1].graph);
  }

  private updateRendering(): void {
    this.updateVertices();
    this.updateEdges();
  }

  private updateVertices(): void {
    const lastRenderingResult = this.getLastRenderingResult();
    const normal = new Vector3(0, 0, 1).applyQuaternion(lastRenderingResult.graphGroup.quaternion);
    const point = lastRenderingResult.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const hit = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) {
      return;
    }

    if (!this.currentlySelectedVertex) {
      return;
    }
    const local = lastRenderingResult.graphGroup.worldToLocal(hit.clone());
    this.currentlySelectedVertex.mesh.position.copy(local);
    this.currentlySelectedVertex.label.position.copy(local);
  }

  private updateEdges(): void {
    if (!this.lastRenderingResult || !this.currentlySelectedVertex) {
      return;
    }

    const selectedId = Number(this.currentlySelectedVertex.id);

    this.getLastRenderingResult().edgeLines.forEach((edge) => {
      const [aIndex, bIndex] = (edge.id as string).split(',').map(Number);

      if (aIndex !== selectedId && bIndex !== selectedId) {
        return;
      }

      const nodeA = this.vertexIdMap.get(aIndex)!.mesh;
      const nodeB = this.vertexIdMap.get(bIndex)!.mesh;

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
      const embeddingResult = await graphLayoutService.compute(graph.edges, graph.nodes.length);

      if (!embeddingResult.planar) {
        return this.updateUIStatus('Checking planarity... ✗', 'error');
      }

      this.updateUIStatus('Checking planarity... ✓ \n Computing planar drawing...', 'okay');

      const result = combinatorialEmbeddingToPosStepWise(graph.edges, embeddingResult.canonical_ordering);
      this.updateUIStatus('Checking planarity... ✓ \n Computing planar drawing... ✓', 'okay');

      const renderingResult = this.graphRenderer.render(result.graphs);
      this.applyRenderingResult(renderingResult, stepwise, millisecondsPerStep);
    } catch (err) {
      this.updateUIStatus(err instanceof Error ? err.message : 'Invalid input.', 'error');
    }
  }

  public update(): void {
    this.controls.update();
    this.webglRenderer.render(this.scene, this.camera);
  }

  private releaseVertex(): void {}

  private dragVertex(mouseX: number, mouseY: number): void {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);
    this.updateRendering();
  }

  protected centerGroup(group: Group): Vector3 {
    const box = new Box3().setFromObject(group);
    const sphere = box.getBoundingSphere(new Sphere());
    group.position.sub(sphere.center);
    return new Vector3(0, 0, sphere.radius * 3);
  }

  private createNewVertexInGraph(x: number, y: number): void {
    const lastRenderingResult = this.getLastRenderingResult();

    this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
    const normal = new Vector3(0, 0, 1).applyQuaternion(lastRenderingResult.graphGroup.quaternion);
    const point = lastRenderingResult.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const vertex = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, vertex)) {
      return;
    }

    const newGraph = this.graphBuilder.addVertices(lastRenderingResult, vertex);
    const newRenderingResult = this.graphRenderer.render([newGraph]);
    this.applyRenderingResult(newRenderingResult, false);
  }

  private checkIfAnyVertexSelected(mouseX: number, mouseY: number): boolean {
    const lastRenderingResult = this.getLastRenderingResult();
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);

    const intersects = this.raycaster.intersectObjects(lastRenderingResult.graphGroup.children, true);

    for (const hit of intersects) {
      const hitVertex = hit.object as Mesh;
      const result = this.vertexMeshMap.get(hitVertex);

      if (result) {
        this.deselectVertex(this.currentlySelectedVertex);
        this.selectVertex(result);
        return true;
      }
    }

    //user clicked in the void
    this.deselectVertex(this.currentlySelectedVertex);
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
}
