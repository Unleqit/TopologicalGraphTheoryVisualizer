import { VisualizationContext } from '../types/visualization-context';

export function ensureDoneBefore(context: VisualizationContext, stepNumber: number): boolean {
  if (!context.once[stepNumber]) {
    return false;
  }
  context.once[stepNumber] = false;
  return true;
}
