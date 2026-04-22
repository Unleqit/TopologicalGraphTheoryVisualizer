import { SurfaceSceneBase } from '../../../../surface-scene-base';
import { redrawEdgeRecords } from '../../../helpers/edge-records/redraw-edge-records';

export function showEdgesAtStart(context: SurfaceSceneBase): void {
  [...context.edges.values()].forEach((edge) => {
    context.scene.add(edge.line);
  });
  redrawEdgeRecords(context, context.coordinateTransformFunction, true, true);
}
