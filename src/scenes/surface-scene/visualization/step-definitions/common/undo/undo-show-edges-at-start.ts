import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function _undoShowEdgesAtStart(context: SurfaceSceneBase): void {
  [...context.edges.values()].forEach((edge) => {
    context.scene.remove(edge.line);
  });
}
