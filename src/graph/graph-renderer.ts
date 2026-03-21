import * as THREE from 'three';
import { GraphEdge } from './types/graph-edge';
import { GraphNode } from './types/graph.node';

export function createGraphGroup(): THREE.Group {
  return new THREE.Group();
}

export function renderGraph(group: THREE.Group, nodes: GraphNode[], edges: GraphEdge[]): void {
  group.clear();

  const nodeMap = new Map<number, THREE.Vector3>();

  for (const n of nodes) {
    nodeMap.set(Number(n.id), new THREE.Vector3(n.x, n.y, 0));
  }

  const edgeVerts: number[] = [];

  for (const [u, v] of edges) {
    const a = nodeMap.get(Number(u))!;
    const b = nodeMap.get(Number(v))!;
    edgeVerts.push(a.x, a.y, 0, b.x, b.y, 0);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));

  group.add(new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color: 0x00ffcc })));

  for (const pos of nodeMap.values()) {
    const node = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshBasicMaterial({ color: 0x1976d2 }));
    node.position.copy(pos);
    group.add(node);
  }
}
