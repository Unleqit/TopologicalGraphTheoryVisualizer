import '../../styles/base.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadDefaultGraph } from '../../graph/layout/load-default-graph';
import { createRenderer, createCamera } from '../utils';
import { AmbientLight, CircleGeometry, DirectionalLight, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Plane, Raycaster, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { Stepper } from '../../ui/stepper';
import { createLabelSprite } from '../../scenes/utils';
import { GraphEmbeddingStepResult } from '../../graph/types/graph-embedding-step-result';
import { GraphRendering, renderRawGraphStepWise } from '../../scenes/graph-scene/graph-scene';
import { PlanarityGraphUIOptions } from './planarity-graph-ui-options';
import { PlanarityGraphUI } from './planarity-graph-input-card';

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
  private rendering!: GraphRendering;

  constructor() {
    this.stepper = new Stepper();
    this.canvas = document.getElementById('viz') as HTMLCanvasElement;
    this.renderer = createRenderer(this.canvas);
    this.scene = new Scene();
    this.camera = createCamera();
    this.lastEmbeddingStepResult = { planar: true, edges: [], nodes: [] };

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = true;
    this.controls.enableRotate = false;

    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);

    this.graphGroup = new Group();
    this.scene.add(this.graphGroup);

    this.raycaster = new Raycaster();
    this.mouse = new Vector2();

    this.canvas.addEventListener('click', (event) => this.handleClick(event));

    const uiOptions: PlanarityGraphUIOptions = {
      graphMatrixInput: document.getElementById('graphMatrix')! as HTMLTextAreaElement,
      graphListInput: document.getElementById('graphList')! as HTMLTextAreaElement,
      loadGraphBtn: document.getElementById('loadGraphBtn')! as HTMLButtonElement,
      statusEl: document.getElementById('graphStatus')!,
      graphGroup: this.graphGroup,
      camera: this.camera,
      stepper: this.stepper,
      onGraphRendered: (rendering) => {
        this.rendering = rendering;
      },
    };

    const graphUI = new PlanarityGraphUI(uiOptions);

    const tabs = document.querySelectorAll<HTMLButtonElement>('.tabBtn');
    const modes = document.querySelectorAll<HTMLElement>('.graphMode');
    graphUI.setupTabs(tabs, modes);

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());

    addEventListener('resize', this.resize);
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
    const label = createLabelSprite(node.userData.id);

    node.position.copy(local);
    node.userData.isNode = true;
    node.userData.id = this.getNextNodeId();
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

  public async initDefaultGraph(): Promise<GraphRendering> {
    const result = await loadDefaultGraph();
    this.lastEmbeddingStepResult = result!;
    this.graphGroup.visible = true;
    this.rendering = await renderRawGraphStepWise(this.graphGroup, this.camera, result!, 250);
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

    this.rendering.edges.forEach((edge) => {
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
}
new PlanarityPage();
