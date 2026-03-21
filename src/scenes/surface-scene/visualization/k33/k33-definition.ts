import { Vector3 } from 'three';
import { _3DGraphVertex } from '../../../../graph/graph-3d-vertex';
import { GraphEdge } from '../../../../graph/graph-edge';

export const K33_EDGE_SEGMENTS = 140;

export const k33Vertices: _3DGraphVertex[] = [
  { vertex: { id: 1, x: 0.25, y: 0.3 }, position: new Vector3() }, // a0
  { vertex: { id: 2, x: 0.5, y: 0.3 }, position: new Vector3() }, // a1
  { vertex: { id: 3, x: 0.75, y: 0.3 }, position: new Vector3() }, // a2
  { vertex: { id: 4, x: 0.25, y: 0.7 }, position: new Vector3() }, // b0
  { vertex: { id: 5, x: 0.5, y: 0.7 }, position: new Vector3() }, // b1
  { vertex: { id: 6, x: 0.75, y: 0.7 }, position: new Vector3() }, // b2
];

export const k33Edges: GraphEdge[] = [
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 3],
  [1, 4],
  [1, 5],
  [2, 3],
  [2, 4],
  [2, 5],
];
