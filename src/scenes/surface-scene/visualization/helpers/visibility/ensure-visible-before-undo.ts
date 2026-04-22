import { SurfaceSceneBase } from '../../../surface-scene-base';

export function ensureVisibleBeforeUndo(context: SurfaceSceneBase, stepNumber: number): boolean {
  if (!context.once[stepNumber]) {
    return false;
  }
  context.once[stepNumber] = false;
  return true;
}
