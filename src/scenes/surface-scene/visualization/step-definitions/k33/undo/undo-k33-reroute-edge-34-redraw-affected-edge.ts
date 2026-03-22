import { removeEdgeRecordsByIDs } from '../../../helpers/remove-edge-records';
import { removeVertexRecordsByIDs } from '../../../helpers/remove-vertex-records';
import { VisualizationContext } from '../../../visualization-context';

export function _undoK33RerouteEdge34_RedrawAffectedEdge(context: VisualizationContext): void {
  removeEdgeRecordsByIDs(context, ['3,7', '4,8']);
  removeVertexRecordsByIDs(context, [7, 8]);
}
