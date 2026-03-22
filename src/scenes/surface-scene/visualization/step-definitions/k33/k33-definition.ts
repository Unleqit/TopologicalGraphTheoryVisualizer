import { MeshBasicMaterial, Vector3 } from 'three';
import { _3DGraphVertex } from '../../../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../../../graph/types/graph-edge';
import { createLabeledVertexMesh } from '../../../../utils';

const matA = new MeshBasicMaterial({ color: 0xff8800, depthTest: false });
const matB = new MeshBasicMaterial({ color: 0xaa00ff, depthTest: false });

export const k33Vertices: _3DGraphVertex[] = [
  { vertex: { id: 1, x: 0.25, y: 0.3 }, position: new Vector3(), mesh: createLabeledVertexMesh(matA, '1', true) }, // a0
  { vertex: { id: 2, x: 0.5, y: 0.3 }, position: new Vector3(), mesh: createLabeledVertexMesh(matA, '2', true) }, // a1
  { vertex: { id: 3, x: 0.75, y: 0.3 }, position: new Vector3(), mesh: createLabeledVertexMesh(matA, '3', true) }, // a2
  { vertex: { id: 4, x: 0.25, y: 0.7 }, position: new Vector3(), mesh: createLabeledVertexMesh(matB, '4', true) }, // b0
  { vertex: { id: 5, x: 0.5, y: 0.7 }, position: new Vector3(), mesh: createLabeledVertexMesh(matB, '5', true) }, // b1
  { vertex: { id: 6, x: 0.75, y: 0.7 }, position: new Vector3(), mesh: createLabeledVertexMesh(matB, '6', true) }, // b2
];

export const k33Edges: GraphEdge[] = [
  [1, 4],
  [1, 5],
  [1, 6],
  [2, 4],
  [2, 5],
  [2, 6],
  [3, 4],
  [3, 5],
  [3, 6],
];

export const K33_EDGE_SEGMENTS = 140;
