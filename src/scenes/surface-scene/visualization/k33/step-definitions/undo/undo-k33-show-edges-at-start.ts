import { redrawEdges } from '../../../helpers/redraw-edges';
import { VisualizationContext } from '../../../types/visualization-context';

export function _undoK33ShowEdgesAtStart(context: VisualizationContext): void {
  redrawEdges(context, true, true);
}
