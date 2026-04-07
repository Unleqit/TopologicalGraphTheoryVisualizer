import { GraphEdge } from '../../../../../graph/types/graph-edge';
import { createEdgeLine } from '../../../../utils';
import { EdgeRecord } from '../../types/edge-record';
import { VertexRecord } from '../../types/vertex-record';

export function createEdgeRecordsFromGraphEdges(vertices: Map<number, VertexRecord>, edges: GraphEdge[], edgeSegmentCount: number): EdgeRecord[] {
  return createEdgeRecordsFromEdgeIDs(
    vertices,
    edges.map((edge) => edge.id), //CHECK!!
    edgeSegmentCount
  );
}

export function createEdgeRecordsFromEdgeIDs(vertices: Map<number, VertexRecord>, edgeIDs: string[], edgeSegmentCount: number): EdgeRecord[] {
  const records = [];
  for (const edgeID of edgeIDs) {
    const line = createEdgeLine(edgeSegmentCount, true);
    const [i0, i1] = edgeID.split(',').map((index) => Number.parseInt(index));
    const min = i0 < i1 ? i0 : i1;
    const max = i0 > i1 ? i0 : i1;
    const v0 = vertices.get(min);
    const v1 = vertices.get(max);

    if (!v0 || !v1) {
      continue;
    }

    const record: EdgeRecord = { id: `${min},${max}`, v0: v0, v1: v1, line, isShadow: false, visible: true };
    records.push(record);
  }
  return records;
}
