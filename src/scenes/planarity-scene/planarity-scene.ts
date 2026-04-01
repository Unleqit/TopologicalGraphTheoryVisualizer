import { GraphEdge } from '../../graph/types/graph-edge';
import { GraphNode } from '../../graph/types/graph.node';
import { GraphEmbeddingStepResult } from '../../graph/types/graph-embedding-step-result';
import {
  Group,
  PerspectiveCamera,
  Vector3,
  BufferGeometry,
  BufferAttribute,
  LineBasicMaterial,
  Mesh,
  CircleGeometry,
  MeshBasicMaterial,
  Sprite,
  CanvasTexture,
  SpriteMaterial,
  Box3,
  Sphere,
  Line,
} from 'three';
import { PlanarityGraphRendering } from './planarity-graph-rendering';

export class PlanarityScene {
  private group: Group;
  private camera: PerspectiveCamera;

  constructor(group: Group, camera: PerspectiveCamera) {
    this.group = group;
    this.camera = camera;
  }

  public async renderRawGraphStepWise(stepResult: GraphEmbeddingStepResult, stepMs: number = 250): Promise<PlanarityGraphRendering> {
    let result: PlanarityGraphRendering = { edgeLines: [], nodeMeshes: [] };
    for (let i = 0; i < stepResult.nodes.length; ++i) {
      result = this.renderRawGraph(stepResult.nodes[i], stepResult.edges[i]);
      this.centerGroup();
      await new Promise((r) => setTimeout(r, stepMs));
    }
    return result;
  }

  public renderRawGraph(nodes: GraphNode[], edges: GraphEdge[]): PlanarityGraphRendering {
    this.group.clear();

    const nodeMap = this.buildNodeMap(nodes);
    const nodeMeshes = this.renderNodes(nodes, nodeMap);
    const edgeLines = this.renderEdges(edges, nodeMap);

    return { edgeLines: edgeLines, nodeMeshes: nodeMeshes };
  }

  private buildNodeMap(nodes: GraphNode[]): Map<number, Vector3> {
    const nodeMap = new Map<number, Vector3>();
    for (const n of nodes) {
      nodeMap.set(Number(n.id), new Vector3(n.x, n.y, 0));
    }
    return nodeMap;
  }

  private renderNodes(nodes: GraphNode[], nodeMap: Map<number, Vector3>): Mesh[] {
    const nodeMeshes: Mesh[] = [];

    for (const n of nodes) {
      nodeMap.set(Number(n.id), new Vector3(n.x, n.y, 0));
    }

    for (const n of nodes) {
      const pos = nodeMap.get(Number(n.id))!;

      const node = new Mesh(new CircleGeometry(0.15, 24), new MeshBasicMaterial({ color: 0x1976d2 }));
      node.position.copy(pos);
      node.userData.isNode = true;
      node.userData.id = n.id;
      this.group.add(node);

      const label = this.createTextLabel(String(n.id));
      label.position.copy(pos);
      label.position.z += 0.01;
      node.userData.label = label;
      this.group.add(label);

      nodeMeshes.push(node);
    }
    return nodeMeshes;
  }

  private renderEdges(edges: GraphEdge[], nodeMap: Map<number, Vector3>): Line[] {
    const edgeLines: Line[] = [];

    for (const [u, v] of edges) {
      const a = nodeMap.get(Number(u))!;
      const b = nodeMap.get(Number(v))!;

      const geom = new BufferGeometry();
      geom.setAttribute('position', new BufferAttribute(new Float32Array([a.x, a.y, 0, b.x, b.y, 0]), 3));

      const line = new Line(geom, new LineBasicMaterial({ color: 0x00ffcc }));
      line.userData.id = `${Math.min(u, v) + 0},${Math.max(u, v) + 0}`;
      this.group.add(line);
      edgeLines.push(line);
    }
    return edgeLines;
  }

  private centerGroup(): void {
    const box = new Box3().setFromObject(this.group);
    const sphere = box.getBoundingSphere(new Sphere());
    this.group.position.sub(sphere.center);
    this.camera.position.set(0, 0, sphere.radius * 3);
  }

  private createTextLabel(text: string): Sprite {
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
}
