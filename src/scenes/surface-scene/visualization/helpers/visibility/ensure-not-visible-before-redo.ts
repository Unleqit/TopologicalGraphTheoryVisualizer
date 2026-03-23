import { VisualizationContext } from '../../visualization-context';

export function ensureNotVisibleBeforeRedo(context: VisualizationContext, stepNumber: number): boolean {
  if (context.once[stepNumber]) {
    return false;
  }
  context.once[stepNumber] = true;
  return true;
}
