import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';
import { removeVertexRecordsByIDs } from '../../../helpers/vertex-records/remove-vertex-records';
import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function _undoK33RerouteEdge34_RedrawAffectedEdge(context: SurfaceSceneBase): void {
  removeEdgeRecordsByIDs(context, ['3,7', '4,8']);
  removeVertexRecordsByIDs(context, [7, 8]);
}
