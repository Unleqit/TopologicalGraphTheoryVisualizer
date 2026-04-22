import { createEdgeRecordsFromEdgeIDs } from '../../../helpers/edge-records/create-edge-records';
import { redrawEdgeRecords } from '../../../helpers/edge-records/redraw-edge-records';
import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function _undoK33FlipVertex2And5_HideAffectedEdges(context: SurfaceSceneBase): void {
  createEdgeRecordsFromEdgeIDs(context.vertices, ['2,4', '2,5', '2,6', '1,5', '3,5'], context.edgeSegmentCount).forEach((edge) => {
    context.edges.set(edge.id, edge);
    context.scene.add(edge.line);
  });
  redrawEdgeRecords(context, context.coordinateTransformFunction, true, true);
}
