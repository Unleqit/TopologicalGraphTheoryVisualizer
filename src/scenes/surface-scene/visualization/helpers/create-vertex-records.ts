import { _3DGraphVertex } from '../../../../graph/types/graph-3d-vertex';
import { VertexRecord } from '../types/vertex-record';

export function createVertexRecords(vertices: _3DGraphVertex[]): VertexRecord[] {
  const records = [];

  for (let i = 0; i < vertices.length; i++) {
    const gv = vertices[i];
    const record: VertexRecord = { id: gv.vertex.id, data: gv, mesh: gv.mesh, isShadow: false, visible: true };
    records.push(record);
  }
  return records;
}
