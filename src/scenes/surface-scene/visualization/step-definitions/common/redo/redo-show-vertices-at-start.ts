import { SurfaceSceneBase } from '../../../../surface-scene-base';
import { redrawVertexRecords } from '../../../helpers/vertex-records/redraw-vertex-records';

export function showVerticesAtStart(context: SurfaceSceneBase): void {
  [...context.vertices.values()].forEach((vertex) => {
    context.scene.add(vertex.mesh);
  });
  redrawVertexRecords(context, context.coordinateTransformFunction, true, true);
}
