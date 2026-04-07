import { Vector3, MeshBasicMaterial } from 'three';
import { _3DGraphVertex } from '../../../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../../../graph/types/graph-edge';
import { createLabeledVertexMesh } from '../../../../utils';

const mat = new MeshBasicMaterial({ color: 0xff8800, depthTest: false });

export const k3Vertices: _3DGraphVertex[] = [
  { vertex: { id: 0, x: 0.2, y: 0.3 }, position: new Vector3(), mesh: createLabeledVertexMesh(mat, '1', true) },
  { vertex: { id: 1, x: 0.8, y: 0.4 }, position: new Vector3(), mesh: createLabeledVertexMesh(mat, '2', true) },
  { vertex: { id: 2, x: 0.5, y: 0.8 }, position: new Vector3(), mesh: createLabeledVertexMesh(mat, '3', true) },
];

export const k3Edges: GraphEdge[] = [
  { id: '0,1', value: [0, 1] },
  { id: '1,2', value: [1, 2] },
  { id: '0,2', value: [2, 0] },
];

export const K3_EDGE_SEGMENTS = 140;
