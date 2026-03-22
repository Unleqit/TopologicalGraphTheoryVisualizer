import { createEdgeRecordsFromEdgeIDs } from '../../../helpers/create-edge-records';
import { redrawEdgeRecords } from '../../../helpers/redraw-edge-records';
import { VisualizationContext } from '../../../visualization-context';

export function _undoK33RerouteEdge16_HideAffectedEdge(context: VisualizationContext): void {
  createEdgeRecordsFromEdgeIDs(context.vertices, ['1,6'], context.edgeSegmentCount).forEach((edge) => {
    context.edges.set(edge.id, edge);
    context.scene.add(edge.line);
  });
  redrawEdgeRecords(context, context.coordinateTransformFunction, true, true);
}
