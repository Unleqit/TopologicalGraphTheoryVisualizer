import { Group, Vector3, BufferGeometry, BufferAttribute, LineSegments, LineBasicMaterial, Mesh, CircleGeometry, MeshBasicMaterial } from 'three';
import { GraphEdge } from './types/graph-edge';
import { GraphNode } from './types/graph.node';

export function createGraphGroup(): Group {
  return new Group();
}

export function renderGraph(group: Group, nodes: GraphNode[], edges: GraphEdge[]): void {
  group.clear();

  const nodeMap = new Map<number, Vector3>();

  for (const n of nodes) {
    nodeMap.set(Number(n.id), new Vector3(n.x, n.y, 0));
  }

  const edgeVerts: number[] = [];

  for (const [u, v] of edges) {
    const a = nodeMap.get(Number(u))!;
    const b = nodeMap.get(Number(v))!;
    edgeVerts.push(a.x, a.y, 0, b.x, b.y, 0);
  }

  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(new Float32Array(edgeVerts), 3));

  group.add(new LineSegments(geom, new LineBasicMaterial({ color: 0x00ffcc })));

  for (const pos of nodeMap.values()) {
    const node = new Mesh(new CircleGeometry(0.15, 24), new MeshBasicMaterial({ color: 0x1976d2 }));
    node.position.copy(pos);
    group.add(node);
  }
}
