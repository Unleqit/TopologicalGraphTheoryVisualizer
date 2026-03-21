import { Mesh } from 'three';
import { _3DGraphVertex } from '../../../../graph/graph-3d-vertex';

export type VertexRecord = { id: number; data: _3DGraphVertex; mesh: Mesh; isShadow: boolean; visible: boolean };
