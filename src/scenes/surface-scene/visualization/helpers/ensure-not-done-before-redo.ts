import { VisualizationContext } from '../types/visualization-context';

export function ensureNotDoneBefore(context: VisualizationContext, stepNumber: number): boolean {
  if (context.once[stepNumber]) {
    return false;
  }
  context.once[stepNumber] = true;
  return true;
}
