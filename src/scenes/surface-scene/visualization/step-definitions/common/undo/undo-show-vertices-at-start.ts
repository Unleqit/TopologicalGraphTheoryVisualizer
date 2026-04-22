import { SurfaceSceneBase } from '../../../../surface-scene-base';

export function _undoShowVerticesAtStart(context: SurfaceSceneBase): void {
  [...context.vertices.values()].forEach((vertex) => {
    context.scene.remove(vertex.mesh);
  });
}
