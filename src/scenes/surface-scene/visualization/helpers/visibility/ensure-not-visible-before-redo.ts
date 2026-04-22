import { SurfaceSceneBase } from '../../../surface-scene-base';

export function ensureNotVisibleBeforeRedo(context: SurfaceSceneBase, stepNumber: number): boolean {
  if (context.once[stepNumber]) {
    return false;
  }
  context.once[stepNumber] = true;
  return true;
}
