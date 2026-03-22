import { redrawEdgeRecords } from '../../../helpers/redraw-edge-records';
import { VisualizationContext } from '../../../visualization-context';

export function showEdgesAtStart(context: VisualizationContext): void {
  [...context.edges.values()].forEach((edge) => {
    context.scene.add(edge.line);
  });
  redrawEdgeRecords(context, context.coordinateTransformFunction, true, true);
}
