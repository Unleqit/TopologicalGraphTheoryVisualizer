import { redrawVertices } from '../../../helpers/redraw-vertices';
import { VisualizationContext } from '../../../types/visualization-context';

export function k33ShowVerticesAtStart(context: VisualizationContext): void {
  redrawVertices(context, true, true);
}
