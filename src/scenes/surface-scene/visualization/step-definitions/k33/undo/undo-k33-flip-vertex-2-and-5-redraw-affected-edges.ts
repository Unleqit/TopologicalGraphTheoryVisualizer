import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';
import { VisualizationContext } from '../../../visualization-context';

export function _undoK33FlipVertex2And5_RedrawAffectedEdges(context: VisualizationContext): void {
  removeEdgeRecordsByIDs(context, ['2,4', '2,5', '2,6', '1,5', '3,5']);
}
