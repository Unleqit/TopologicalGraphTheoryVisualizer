import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';
import { removeVertexRecordsByIDs } from '../../../helpers/vertex-records/remove-vertex-records';
import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function _undoK33RerouteEdge16_RedrawAffectedEdge(context: SurfaceSceneBase): void {
  removeEdgeRecordsByIDs(context, ['1,9', '6,10']);
  removeVertexRecordsByIDs(context, [9, 10]);
}
