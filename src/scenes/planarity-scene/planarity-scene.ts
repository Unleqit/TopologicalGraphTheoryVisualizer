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

export async function renderRawGraphStepWise(group: Group, camera: PerspectiveCamera, stepResult: GraphEmbeddingStepResult, stepMs: number = 250): Promise<GraphRendering> {
  let result: GraphRendering;
  for (let i = 0; i < stepResult.nodes.length; ++i) {
    result = renderRawGraph(group, stepResult.nodes[i], stepResult.edges[i]);
    centerGroup(group, camera);
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return result!;
}

export type GraphRendering = { nodes: Mesh[]; edges: Line[] };

export function renderRawGraph(group: Group, nodes: GraphNode[], edges: GraphEdge[]): GraphRendering {
  group.clear();

  const nodeMap = new Map<number, Vector3>();
  const nodeMeshes: Mesh[] = [];
  const edgeMeshes: Line[] = [];

  for (const n of nodes) {
    nodeMap.set(Number(n.id), new Vector3(n.x, n.y, 0));
  }

  for (const [u, v] of edges) {
    const a = nodeMap.get(Number(u))!;
    const b = nodeMap.get(Number(v))!;

    const geom = new BufferGeometry();
    geom.setAttribute('position', new BufferAttribute(new Float32Array([a.x, a.y, 0, b.x, b.y, 0]), 3));

    const line = new Line(geom, new LineBasicMaterial({ color: 0x00ffcc }));
    line.userData.id = `${Math.min(u, v) + 0},${Math.max(u, v) + 0}`;
    group.add(line);
    edgeMeshes.push(line);
  }

  for (const n of nodes) {
    const pos = nodeMap.get(Number(n.id))!;

    const node = new Mesh(new CircleGeometry(0.15, 24), new MeshBasicMaterial({ color: 0x1976d2 }));
    node.position.copy(pos);
    node.userData.isNode = true;
    node.userData.id = n.id;
    group.add(node);

    const label = createTextLabel(String(n.id));
    label.position.copy(pos);
    label.position.z += 0.01;
    node.userData.label = label;
    group.add(label);

    nodeMeshes.push(node);
  }

  return { edges: edgeMeshes, nodes: nodeMeshes };
}

function createTextLabel(text: string): Sprite {
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

function centerGroup(group: Group, camera: PerspectiveCamera): void {
  const box = new Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new Sphere());
  group.position.sub(sphere.center);
  camera.position.set(0, 0, sphere.radius * 3);
}
