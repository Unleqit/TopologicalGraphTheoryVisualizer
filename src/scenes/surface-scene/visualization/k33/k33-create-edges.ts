import { createEdgeLine } from '../../../utils';
import { k33Edges, k33Vertices, K33_EDGE_SEGMENTS } from './k33-definition';
import { EdgeRecord } from '../types/edge-record';
import { VisualizationContext } from '../types/visualization-context';

export function createK33TorusEdges(context: VisualizationContext): void {
  for (const [i0, i1] of k33Edges) {
    const gv0 = k33Vertices[i0];
    const gv1 = k33Vertices[i1];
    const v0 = context.vertices.get(gv0.vertex.id);
    const v1 = context.vertices.get(gv1.vertex.id);
    const line = createEdgeLine([i0, i1], K33_EDGE_SEGMENTS, true);
    if (!v0 || !v1) {
      return;
    }
    const min = v0.id < v1.id ? v0.id : v1.id;
    const max = v0.id > v1.id ? v0.id : v1.id;
    const record: EdgeRecord = { id: `${min},${max}`, v0, v1, line, isShadow: false, visible: true };
    context.edges.set(record.id, record);
    context.scene.add(line);
  }
}
