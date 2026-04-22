import { removeEdgeRecordsByIDs } from '../../../helpers/edge-records/remove-edge-records';
import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function k33RerouteEdge16_HideAffectedEdge(context: SurfaceSceneBase): void {
  removeEdgeRecordsByIDs(context, ['1,6']);
}
