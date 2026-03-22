import { removeEdgeRecordsByIDs } from '../../../helpers/remove-edge-records';
import { removeVertexRecordsByIDs } from '../../../helpers/remove-vertex-records';
import { VisualizationContext } from '../../../visualization-context';

export function _undoK33RerouteEdge16_RedrawAffectedEdge(context: VisualizationContext): void {
  removeEdgeRecordsByIDs(context, ['1,9', '6,10']);
  removeVertexRecordsByIDs(context, [9, 10]);
}
