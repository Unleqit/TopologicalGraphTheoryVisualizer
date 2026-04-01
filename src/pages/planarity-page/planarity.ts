import '../../styles/themes/base.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadDefaultGraph } from '../../graph/layout/load-default-graph';
import { createRenderer, createCamera } from '../utils';
import { AmbientLight, CircleGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Plane, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { Stepper } from '../../ui/stepper';
import { createLabelSprite } from '../../scenes/utils';
import { GraphEmbeddingStepResult } from '../../graph/types/graph-embedding-step-result';
import { renderRawGraphStepWise } from '../../scenes/graph-scene/graph-scene';
import { graphLayoutService } from '../../graph/layout/index';
import { PlanarityScene } from '../../scenes/planarity-scene/planarity-scene';
import { PlanarityPageInputMode } from './planarity-page-input-mode';
import { matrixToEdgeList } from '../../graph/graph-utils';
import { combinatorialEmbeddingToPosStepWise } from '../../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { PlanarityGraphRendering } from '../../scenes/planarity-scene/planarity-graph-rendering';

export class PlanarityPage {
  private stepper: Stepper;
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private graphGroup: Group;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private selectedNode: Mesh | undefined;
  private lastStep: number;
  private lastEmbeddingStepResult: GraphEmbeddingStepResult;
  private isDragging: boolean = false;
  private rendering!: PlanarityGraphRendering;
  private planarityScene: PlanarityScene;
  private currentMode: PlanarityPageInputMode;

  private graphMatrixInput: HTMLTextAreaElement;
  private graphListInput: HTMLTextAreaElement;
  private loadGraphBtn: HTMLButtonElement;
  private statusEl: HTMLElement;

  constructor() {
    this.stepper = new Stepper();
    this.canvas = document.getElementById('viz') as HTMLCanvasElement;
    this.renderer = createRenderer(this.canvas);
    this.scene = new Scene();
    this.camera = createCamera();
    this.lastEmbeddingStepResult = { planar: true, edges: [], nodes: [] };
    this.currentMode = 'matrix';

    this.graphMatrixInput = document.getElementById('graphMatrix')! as HTMLTextAreaElement;
    this.graphListInput = document.getElementById('graphList')! as HTMLTextAreaElement;
    this.loadGraphBtn = document.getElementById('loadGraphBtn')! as HTMLButtonElement;
    this.statusEl = document.getElementById('graphStatus')!;

    this.loadGraphBtn.addEventListener('click', this.loadGraphFromInput.bind(this));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enableRotate = false;

    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);

    this.graphGroup = new Group();
    this.scene.add(this.graphGroup);
    this.planarityScene = new PlanarityScene(this.graphGroup, this.camera);

    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    this.canvas.addEventListener('click', (event) => this.handleClick(event));

    const tabs = document.querySelectorAll<HTMLButtonElement>('.tabBtn');
    const modes = document.querySelectorAll<HTMLElement>('.graphMode');
    this.setupTabs(tabs, modes);

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());

    addEventListener('resize', this.resize.bind(this));
    this.resize();

    this.lastStep = this.stepper.getStep();
    this.initDefaultGraph().then((result) => (this.rendering = result));

    requestAnimationFrame(this.tick.bind(this));
  }

  //-------mouse---------

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.selectedNode) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.updateRendering();
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0 || event.ctrlKey) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.graphGroup.children, true);

    for (const hit of intersects) {
      const obj = hit.object as Mesh;

      if (obj.userData.isNode) {
        this.selectNode(obj);

        const normal = new Vector3(0, 0, 1).applyQuaternion(this.graphGroup.quaternion);
        const point = this.graphGroup.getWorldPosition(new Vector3());
        const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

        const hitPoint = new Vector3();
        this.raycaster.ray.intersectPlane(plane, hitPoint);
        this.isDragging = true;
        return;
      }
    }
  }

  //---------------------

  private handleClick(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (event.ctrlKey) {
      this.createNewVertexInGraph(event.clientX, event.clientY);
      return;
    }
    this.checkIfNodeSelected();
  }

  private createNewVertexInGraph(x: number, y: number): void {
    const normal = new Vector3(0, 0, 1).applyQuaternion(this.graphGroup.quaternion);
    const point = this.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const hit = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) {
      return;
    }

    this.addVertex(hit);
  }

  private checkIfNodeSelected(): void {
    const intersects = this.raycaster.intersectObjects(this.graphGroup.children, true);

    for (const hit of intersects) {
      const obj = hit.object as Mesh;

      if (obj.userData.isNode) {
        this.selectNode(obj);
        return;
      }
    }

    this.clearSelection();
  }

  private addVertex(worldPos: Vector3): void {
    const local = this.graphGroup.worldToLocal(worldPos.clone());

    const node = new Mesh(new CircleGeometry(0.15, 24), new MeshBasicMaterial({ color: 0x1976d2 }));

    node.position.copy(local);
    node.userData.isNode = true;
    node.userData.id = this.getNextNodeId();

    const label = createLabelSprite(node.userData.id);
    label.position.copy(local);
    label.position.z += 0.01;
    node.userData.label = label;

    this.graphGroup.add(node);
    this.graphGroup.add(label);
  }

  private getNextNodeId(): string {
    if (this.lastEmbeddingStepResult.nodes.length > this.lastStep) {
      this.lastStep = this.lastEmbeddingStepResult.nodes.length + 2;
    } else {
      this.lastStep++;
    }
    return this.lastStep.toString();
  }

  private selectNode(node: Mesh): void {
    if (this.selectedNode) {
      (this.selectedNode.material as MeshBasicMaterial).color.set(0x1976d2);
    }

    this.selectedNode = node;
    (node.material as MeshBasicMaterial).color.set(0xffff00);
  }

  private clearSelection(): void {
    if (!this.selectedNode) {
      return;
    }

    (this.selectedNode.material as MeshBasicMaterial).color.set(0x1976d2);
    this.selectedNode = undefined;
  }

  public async initDefaultGraph(): Promise<PlanarityGraphRendering> {
    this.showStatus('Computing layout...', 'info');
    this.lastEmbeddingStepResult = (await loadDefaultGraph())!;
    this.graphGroup.visible = true;
    this.rendering = await renderRawGraphStepWise(this.graphGroup, this.camera, this.lastEmbeddingStepResult, 250);
    this.showStatus('Planar: ✓', 'okay');
    return this.rendering;
  }

  private updateRendering(): void {
    this.updateVertices();
    this.updateEdges();
  }

  private updateVertices(): void {
    const normal = new Vector3(0, 0, 1).applyQuaternion(this.graphGroup.quaternion);
    const point = this.graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const hit = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, hit)) {
      return;
    }

    if (!this.selectedNode) {
      return;
    }
    const local = this.graphGroup.worldToLocal(hit.clone());
    this.selectedNode.position.copy(local);

    // ---- move label exactly with the node ----
    const label = this.selectedNode.userData.label;
    if (label) {
      label.position.copy(local);
      label.position.z += 0.01; // keep it slightly above the node
    }
  }

  private updateEdges(): void {
    if (!this.rendering || !this.selectedNode) {
      return;
    }

    const selectedId = Number(this.selectedNode.userData.id);

    this.rendering.edgeLines.forEach((edge) => {
      const [aIndex, bIndex] = (edge.userData.id as string).split(',').map(Number);

      if (aIndex !== selectedId && bIndex !== selectedId) {
        return;
      }

      // ✅ use REAL scene nodes
      const nodeA = this.getNodeById(aIndex);
      const nodeB = this.getNodeById(bIndex);

      if (!nodeA || !nodeB) {
        return;
      }

      const posAttr = edge.geometry.getAttribute('position');

      posAttr.setXYZ(0, nodeA.position.x, nodeA.position.y, nodeA.position.z);
      posAttr.setXYZ(1, nodeB.position.x, nodeB.position.y, nodeB.position.z);
      posAttr.needsUpdate = true;
    });
  }
  private getNodeById(id: number): Mesh | undefined {
    return this.graphGroup.children.find((obj) => (obj as Mesh).userData?.isNode && Number(obj.userData.id) === id) as Mesh | undefined;
  }

  private resize(): void {
    const area = document.querySelector('.canvasArea')!;
    this.renderer.setSize(area.clientWidth, area.clientHeight, false);
    this.camera.aspect = area.clientWidth / area.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  private tick(): void {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.tick.bind(this));
  }

  public async loadGraphFromInput(): Promise<void> {
    this.showStatus('', 'info');

    try {
      let matrix: number[][] = [];

      switch (this.currentMode) {
        case 'matrix':
          matrix = this.parseMatrix();
          break;
        case 'list':
          matrix = this.parseAdjacencyList();
          break;
      }

      this.validateInput(matrix);
      this.showStatus('Computing layout...', 'info');

      const { nodeCount, edges } = matrixToEdgeList(matrix);
      const embeddingResult = await graphLayoutService.compute(edges, nodeCount);

      if (!embeddingResult.planar) {
        this.showStatus('Planar: ✗', 'error');
        return;
      }

      this.graphGroup.visible = true;

      const result = combinatorialEmbeddingToPosStepWise(edges, embeddingResult.canonical_ordering);
      this.rendering = await this.planarityScene.renderRawGraphStepWise(result, 250);

      this.stepper.setStep(1);
      this.showStatus('Planar: ✓', 'okay');
    } catch (err) {
      this.showStatus(err instanceof Error ? err.message : 'Invalid input.', 'error');
    }
  }

  private showStatus(message: string, type: 'info' | 'okay' | 'error'): void {
    this.statusEl.className = 'statusText' + (type === 'info' ? '' : type === 'okay' ? ' ok' : ' error');
    this.statusEl.textContent = message;
  }

  private parseMatrix(): number[][] {
    const text = this.graphMatrixInput.value.trim();
    if (!text) {
      throw new Error('Please enter a matrix.');
    }
    const matrix = text.split('\n').map((line) =>
      line
        .trim()
        .split(/\s+/)
        .map((v) => {
          const num = Number(v);
          if (Number.isNaN(num)) {
            throw new Error('Invalid number in matrix.');
          }
          return num;
        })
    );
    return matrix;
  }

  private parseAdjacencyList(): number[][] {
    const text = this.graphListInput.value.trim();
    if (!text) {
      throw new Error('Please enter an adjacency list.');
    }
    const tempMap = new Map<number, number[]>();
    const splitResult = text.split('\n');
    for (let i = 0; i < splitResult.length; ++i) {
      if (!splitResult[i]) {
        throw new Error('Invalid list format.');
      }
      const neighbors = splitResult[i]
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((v) => {
          const num = Number(v);
          if (Number.isNaN(num)) {
            throw new Error('Invalid neighbor index.');
          }
          return num;
        });
      tempMap.set(i, neighbors);
    }

    const n = Math.max(...tempMap.keys()) + 1;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    for (const [u, neighbors] of tempMap) {
      for (const v of neighbors) {
        matrix[u][v] = 1;
        matrix[v][u] = 1;
      }
    }

    return matrix;
  }

  private validateInput(matrix: number[][]): void {
    const n = matrix.length;
    if (!matrix.every((row) => row.length === n)) {
      throw new Error('Matrix must be square.');
    }
    for (let i = 0; i < n; i++) {
      if (matrix[i][i] !== 0) {
        throw new Error('Diagonal must be 0.');
      }
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] !== matrix[j][i]) {
          throw new Error('Graph must be undirected.');
        }
      }
    }
  }

  public setMode(mode: PlanarityPageInputMode): void {
    this.currentMode = mode;
  }

  public setupTabs(tabButtons: NodeListOf<HTMLButtonElement>, modes: NodeListOf<HTMLElement>): void {
    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as 'matrix' | 'list' | 'interactive';
        if (!mode) {
          return;
        }
        this.setMode(mode);
        tabButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        modes.forEach((m) => m.classList.toggle('active', m.dataset.mode === mode));
      });
    });
  }
}
new PlanarityPage();
