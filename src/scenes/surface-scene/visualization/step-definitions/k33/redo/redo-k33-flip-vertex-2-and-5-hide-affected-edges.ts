import { SurfaceSceneBase } from '../../../../surface-scene-base';
import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';

export function k33FlipVertex2And5_HideAffectedEdges(context: SurfaceSceneBase): void {
  removeEdgeRecordsByIDs(context, ['2,4', '2,5', '2,6', '1,5', '3,5']);
}
