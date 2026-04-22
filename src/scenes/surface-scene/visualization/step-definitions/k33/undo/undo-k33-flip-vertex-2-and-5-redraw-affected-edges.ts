import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';
import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function _undoK33FlipVertex2And5_RedrawAffectedEdges(context: SurfaceSceneBase): void {
  removeEdgeRecordsByIDs(context, ['2,4', '2,5', '2,6', '1,5', '3,5']);
}
