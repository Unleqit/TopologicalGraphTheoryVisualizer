import { GraphEmbeddingStepResult } from '../../graph/types/graph-embedding-step-result';
import { Group, PerspectiveCamera, Vector3, Mesh, CircleGeometry, MeshBasicMaterial, Scene, AmbientLight, DirectionalLight, Plane, Raycaster, Vector2, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera, createRenderer } from '../../pages/utils';
import { PlanaritySceneMouseHandler } from './interaction/planarity-scene-mouse-handler';
import { combinatorialEmbeddingToPosStepWise } from '../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { matrixToEdgeList } from '../../graph/graph-utils';
import { PlanarityPageStatusMode } from '../../pages/planarity-page/planarity-page-status-mode';
import { createLabelSprite } from '../utils';
import { graphLayoutService } from './layout/index';
import { PLANARITY_PAGE_DEFAULT_GRAPH } from './planarity-page-default-graph';
import { PlanarityPageGraphRenderer } from './graph-renderer/planarity-page-graph-renderer';
import { PlanarityPageStepwiseGraphRenderer } from './graph-renderer/stepwise/planarity-page-stepwise-graph-renderer';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-page-graph-rendering-result';
import { GraphNode } from '../../graph/types/graph.node';
import { GraphEdge } from '../../graph/types/graph-edge';
import { PlanarityPageGraphNode } from './graph-renderer/planarity-page-graph-node';

export class PlanarityScene {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private webglRenderer: WebGLRenderer;

  private mouseHandler: PlanaritySceneMouseHandler;
  private raycaster: Raycaster;
  private currentlySelectedVertex: PlanarityPageGraphNode | undefined;
  private highestVertexId: number;
  private lastRenderingResult: PlanarityPageGraphRenderingResult[];
  private updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void;
  private graphRenderer: PlanarityPageGraphRenderer;
  private stepwiseGraphRenderer: PlanarityPageStepwiseGraphRenderer;
  private vertexMeshMap: Map<Mesh, PlanarityPageGraphNode>;
  private vertexIdMap: Map<number, PlanarityPageGraphNode>;

  constructor(canvasElement: HTMLCanvasElement, updateUIStatus: (text: string, mode: PlanarityPageStatusMode) => void) {
    this.webglRenderer = createRenderer(canvasElement);
    this.scene = new Scene();
    this.camera = createCamera();
    this.controls = new OrbitControls(this.camera, canvasElement);
    this.controls.enableZoom = true;
    this.controls.enableRotate = false;
    this.raycaster = new Raycaster();
    this.updateUIStatus = updateUIStatus;
    this.graphRenderer = new PlanarityPageGraphRenderer(this.onRenderingRecenter.bind(this));
    this.stepwiseGraphRenderer = new PlanarityPageStepwiseGraphRenderer(this.applyRenderingResult.bind(this), this.onRenderingRecenter.bind(this));
    this.lastRenderingResult = [{ graphGroup: new Group(), nodeMeshes: [], edgeLines: [] }];
    this.scene.add(this.getLastRenderingResult().graphGroup);
    this.vertexMeshMap = new Map();
    this.vertexIdMap = new Map();

    this.mouseHandler = new PlanaritySceneMouseHandler(
      this.camera,
      canvasElement,
      this.handleCtrlClick.bind(this),
      this.checkIfAnyVertexSelected.bind(this),
      this.dragVertex.bind(this),
      this.releaseVertex.bind(this)
    );
    this.highestVertexId = -1;

    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);

    //render default graph async
    this.loadGraphFromMatrix(PLANARITY_PAGE_DEFAULT_GRAPH, true, 250);
  }

  private getLastRenderingResult(): PlanarityPageGraphRenderingResult {
    return this.lastRenderingResult[this.lastRenderingResult.length - 1];
  }

  private onRenderingRecenter(newPos: Vector3): void {
    this.camera.position.set(newPos.x, newPos.y, newPos.z);
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
          this.addEdge(this.currentlySelectedVertex, result);
          return;
        }
      }
    }

    this.createNewVertexInGraph(mouseX, mouseY);
  }

  private addVertex(worldPos: Vector3): void {
    const lastRenderingResult = this.getLastRenderingResult();
    const local = lastRenderingResult.graphGroup.worldToLocal(worldPos.clone());
    const newNode: GraphNode = { id: Number(this.getNextNodeId()), x: local.x, y: local.y };
    const renderingResult = this.graphRenderer.addToRendering(lastRenderingResult, [newNode], []);
    this.applyRenderingResult(renderingResult);
  }

  private addEdge(vertexA: PlanarityPageGraphNode, vertexB: PlanarityPageGraphNode): void {
    const lastRenderingResult = this.getLastRenderingResult();
    const [idA, idB] = [vertexA, vertexB].map((v) => v.id);
    const newEdge: GraphEdge = [Math.min(idA, idB), Math.max(idA, idB)];
    const renderingResult = this.graphRenderer.addToRendering(lastRenderingResult, [], [newEdge]);
    this.applyRenderingResult(renderingResult);
  }

  private applyRenderingResult(rendering: PlanarityPageGraphRenderingResult): void {
    const lastRenderingResult = this.getLastRenderingResult();
    this.vertexMeshMap = new Map(rendering.nodeMeshes.map((node) => [node.mesh, node]));
    this.vertexIdMap = new Map(rendering.nodeMeshes.map((node) => [node.id, node]));
    lastRenderingResult.graphGroup.visible = false;
    rendering.graphGroup.visible = true;
    this.scene.remove(lastRenderingResult.graphGroup);
    this.scene.add(rendering.graphGroup);
    this.lastRenderingResult.push(rendering);
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

  public async loadGraphFromMatrix(matrix: number[][], stepwise: boolean = true, millisecondsPerStep: number = 500): Promise<void> {
    this.updateUIStatus('Checking planarity...', 'info');

    try {
      const { nodeCount, edges } = matrixToEdgeList(matrix);
      const embeddingResult = await graphLayoutService.compute(edges, nodeCount);

      if (!embeddingResult.planar) {
        return this.updateUIStatus('Checking planarity... ✗', 'error');
      }

      this.updateUIStatus('Checking planarity... ✓ \n Computing planar drawing...', 'okay');

      const result = combinatorialEmbeddingToPosStepWise(edges, embeddingResult.canonical_ordering);
      this.updateUIStatus('Checking planarity... ✓ \n Computing planar drawing... ✓', 'okay');

      if (stepwise) {
        await this.stepwiseGraphRenderer.startRendering(result, millisecondsPerStep);
      } else {
        this.lastRenderingResult = [];
        const renderingResult = this.graphRenderer.render(result.nodes[result.nodes.length - 1], result.edges[result.edges.length - 1]);
        this.applyRenderingResult(renderingResult);
      }
    } catch (err) {
      this.updateUIStatus(err instanceof Error ? err.message : 'Invalid input.', 'error');
    }
  }

  public update(): void {
    this.controls.update();
    this.webglRenderer.render(this.scene, this.camera);
  }

  private getNextNodeId(): string {
    const lastRenderingResult = this.getLastRenderingResult();
    if (lastRenderingResult.nodeMeshes.length > this.highestVertexId) {
      this.highestVertexId = lastRenderingResult.nodeMeshes.length;
    } else {
      this.highestVertexId++;
    }
    return this.highestVertexId.toString();
  }

  private releaseVertex(): void {}

  private dragVertex(mouseX: number, mouseY: number): void {
    this.raycaster.setFromCamera(new Vector2(mouseX, mouseY), this.camera);
    this.updateRendering();
  }

  private createNewVertexInGraph(x: number, y: number): void {
    const lastRenderingResult = this.getLastRenderingResult();

    this.raycaster.setFromCamera(new Vector2(x, y), this.camera);
    const normal = new Vector3(0, 0, 1).applyQuaternion(lastRenderingResult.graphGroup.quaternion);
    const point = lastRenderingResult.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const hit = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) {
      return;
    }

    this.addVertex(hit);
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
