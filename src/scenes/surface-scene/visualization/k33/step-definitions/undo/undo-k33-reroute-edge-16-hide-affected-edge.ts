import { createEdgeLine } from '../../../../../utils';
import { redrawEdges } from '../../../helpers/redraw-edges';
import { EdgeRecord } from '../../../types/edge-record';
import { VisualizationContext } from '../../../types/visualization-context';
import { K33_EDGE_SEGMENTS } from '../../k33-definition';

export function _undoK33RerouteEdge16_HideAffectedEdge(context: VisualizationContext): void {
  for (const id of ['1,6']) {
    const aaa = id.split(',');
    const i0 = Number.parseInt(aaa[0]);
    const i1 = Number.parseInt(aaa[1]);
    const v0 = context.vertices.get(i0);
    const v1 = context.vertices.get(i1);
    if (v0 && v1) {
      const line = createEdgeLine([i0, i1], K33_EDGE_SEGMENTS, true);
      const record: EdgeRecord = { id, v0, v1, line, isShadow: false, visible: true };
      context.edges.set(record.id, record);
      context.scene.add(line);
    }
  }

  redrawEdges(context, true, true);
}
