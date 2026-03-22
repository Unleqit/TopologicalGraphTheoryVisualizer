import { removeEdgeRecordsByIDs } from '../../../helpers/remove-edge-records';
import { VisualizationContext } from '../../../visualization-context';

export function k33FlipVertex2And5_HideAffectedEdges(context: VisualizationContext): void {
  removeEdgeRecordsByIDs(context, ['2,4', '2,5', '2,6', '1,5', '3,5']);
}
