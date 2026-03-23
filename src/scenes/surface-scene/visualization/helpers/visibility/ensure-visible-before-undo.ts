import { VisualizationContext } from '../../visualization-context';

export function ensureVisibleBeforeUndo(context: VisualizationContext, stepNumber: number): boolean {
  if (!context.once[stepNumber]) {
    return false;
  }
  context.once[stepNumber] = false;
  return true;
}
