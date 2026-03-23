import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';
import { removeVertexRecordsByIDs } from '../../../helpers/vertex-records/remove-vertex-records';
import { VisualizationContext } from '../../../visualization-context';

export function _undoK33RerouteEdge25_RedrawAffectedEdge(context: VisualizationContext): void {
  removeEdgeRecordsByIDs(context, ['2,7', '5,8']);
  removeVertexRecordsByIDs(context, [7, 8]);
}
