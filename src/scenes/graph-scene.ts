import * as THREE from 'three';
import { GraphEdge } from '../graph/graph-edge';
import { GraphNode } from '../graph/graph.node';
import { createNodeCircle } from '../threejs/shapes/node-circle';
import { centerGroup } from '../threejs/camera';
import { GraphEmbeddingStepResult } from '../graph/graph-embedding-step-result';

export async function renderRawGraphStepWise(group: THREE.Group, camera: THREE.PerspectiveCamera, stepResult: GraphEmbeddingStepResult, stepMs: number = 250): Promise<void> {
  for (let i = 0; i < stepResult.nodes.length; ++i) {
    renderRawGraph(group, stepResult.nodes[i], stepResult.edges[i]);
    centerGroup(group, camera);
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

export function renderRawGraph(group: THREE.Group, nodes: GraphNode[], edges: GraphEdge[]): void {
  group.clear();

  const nodeMap = new Map<number, THREE.Vector3>();

  for (const n of nodes) {
    nodeMap.set(Number(n.id), new THREE.Vector3(n.x, n.y, 0));
  }

  const edgeVerts: number[] = [];

  for (const [u, v] of edges) {
    const a = nodeMap.get(Number(u));
    const b = nodeMap.get(Number(v));
    edgeVerts.push(a!.x, a!.y, 0, b!.x, b!.y, 0);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));

  group.add(new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color: 0x00ffcc })));

  for (const n of nodes) {
    const pos = nodeMap.get(n.id)!;

    const node = createNodeCircle();
    node.position.copy(pos);
    group.add(node);

    // ---- node id label ----
    const label = createTextLabel(String(n.id));
    label.position.copy(pos);
    label.position.z += 0.01; // slight offset so it renders above the node
    group.add(label);
  }
}

function createTextLabel(text: string): THREE.Sprite {
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

  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.4, 0.4, 1); // adjust depending on your scene scale

  return sprite;
}
