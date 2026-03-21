import { VisualizationContext } from '../../../types/visualization-context';

export function _undoK33FlipVertex2And5_RedrawAffectedEdges(context: VisualizationContext): void {
  ['2,4', '2,5', '2,6', '1,5', '3,5'].forEach((edgeId) => {
    const edge = context.edges.get(edgeId);
    if (edge) {
      context.scene.remove(edge.line);
      context.edges.delete(edgeId);
    }
  });
}
