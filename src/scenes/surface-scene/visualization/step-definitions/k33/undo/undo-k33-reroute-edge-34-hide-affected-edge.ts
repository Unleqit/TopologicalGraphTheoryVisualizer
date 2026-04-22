import { createEdgeRecordsFromEdgeIDs } from '../../../helpers/edge-records/create-edge-records';
import { redrawEdgeRecords } from '../../../helpers/edge-records/redraw-edge-records';
import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function _undoK33RerouteEdge34_HideAffectedEdge(context: SurfaceSceneBase): void {
  createEdgeRecordsFromEdgeIDs(context.vertices, ['3,4'], context.edgeSegmentCount).forEach((edge) => {
    context.edges.set(edge.id, edge);
    context.scene.add(edge.line);
  });
  redrawEdgeRecords(context, context.coordinateTransformFunction, true, true);
}
