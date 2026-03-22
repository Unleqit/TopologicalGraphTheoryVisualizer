import { VisualizationContext } from '../../../visualization-context';

export function _undoShowEdgesAtStart(context: VisualizationContext): void {
  [...context.edges.values()].forEach((edge) => {
    context.scene.remove(edge.line);
  });
}
