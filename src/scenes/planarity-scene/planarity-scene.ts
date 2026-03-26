import { GraphEdge } from '../../graph/types/graph-edge';
import { GraphNode } from '../../graph/types/graph.node';
import { GraphEmbeddingStepResult } from '../../graph/types/graph-embedding-step-result';
import {
  Group,
  PerspectiveCamera,
  Vector3,
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
  Mesh,
  CircleGeometry,
  MeshBasicMaterial,
  Sprite,
  CanvasTexture,
  SpriteMaterial,
  Box3,
  Sphere,
  Scene,
  Object3D,
  AmbientLight,
  DirectionalLight,
} from 'three';

export class PlanarityScene {
  readonly scene = new Scene();
  private camera: PerspectiveCamera;
  private group: Group;
  private objects: Object3D[] = [];

  constructor(camera: PerspectiveCamera) {
    this.camera = camera;
    this.group = new Group();
    this.scene.add(this.group);

    this.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);

    this.group.visible = true;

    this.add(dir);
  }

  public add(obj: Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  public setVisible(visible: boolean): void {
    this.group.visible = visible;
  }

  async renderRawGraphStepWise(stepResult: GraphEmbeddingStepResult, stepMs: number = 250): Promise<void> {
    for (let i = 0; i < stepResult.nodes.length; ++i) {
      this.renderRawGraph(stepResult.nodes[i], stepResult.edges[i]);
      this.centerGroup();
      await new Promise((r) => setTimeout(r, stepMs));
    }
  }

  applyStep(step: number): void {
    this.group.visible = step === 4;
  }

  renderRawGraph(nodes: GraphNode[], edges: GraphEdge[]): void {
    this.group.clear();

    const nodeMap = new Map<number, Vector3>();

    for (const n of nodes) {
      nodeMap.set(Number(n.id), new Vector3(n.x, n.y, 0));
    }

    const edgeVerts: number[] = [];

    for (const [u, v] of edges) {
      const a = nodeMap.get(Number(u));
      const b = nodeMap.get(Number(v));
      edgeVerts.push(a!.x, a!.y, 0, b!.x, b!.y, 0);
    }

    const geom = new BufferGeometry();
    geom.setAttribute('position', new BufferAttribute(new Float32Array(edgeVerts), 3));

    this.group.add(new LineSegments(geom, new LineBasicMaterial({ color: 0x00ffcc })));

    for (const n of nodes) {
      const pos = nodeMap.get(n.id)!;

      const node = new Mesh(new CircleGeometry(0.15, 24), new MeshBasicMaterial({ color: 0x1976d2 }));
      node.position.copy(pos);
      this.group.add(node);

      // ---- node id label ----
      const label = this.createTextLabel(String(n.id));
      label.position.copy(pos);
      label.position.z += 0.01; // slight offset so it renders above the node
      this.group.add(label);
    }
  }

  createTextLabel(text: string): Sprite {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(text, size / 2, size / 2);

    const texture = new CanvasTexture(canvas);

    const material = new SpriteMaterial({ map: texture, transparent: true });

    const sprite = new Sprite(material);
    sprite.scale.set(0.4, 0.4, 1); // adjust depending on your scene scale

    return sprite;
  }

  centerGroup(): void {
    const box = new Box3().setFromObject(this.group);
    const sphere = box.getBoundingSphere(new Sphere());
    this.group.position.sub(sphere.center);
    this.camera.position.set(0, 0, sphere.radius * 3);
  }
}
