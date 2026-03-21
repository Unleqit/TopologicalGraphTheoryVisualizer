import { redrawVertices } from '../../../helpers/redraw-vertices';
import { VisualizationContext } from '../../../types/visualization-context';

export function _undoK33ShowVerticesAtStart(context: VisualizationContext): void {
  redrawVertices(context, true, true);
}
