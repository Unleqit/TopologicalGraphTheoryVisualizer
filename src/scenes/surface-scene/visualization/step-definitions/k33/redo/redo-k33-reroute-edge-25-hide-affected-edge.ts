import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';
import { VisualizationContext } from '../../../visualization-context';

export function k33RerouteEdge25_HideAffectedEdge(context: VisualizationContext): void {
  removeEdgeRecordsByIDs(context, ['2,5']);
}
