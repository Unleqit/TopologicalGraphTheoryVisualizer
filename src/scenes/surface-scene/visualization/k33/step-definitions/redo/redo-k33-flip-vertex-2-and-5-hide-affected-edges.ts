import { VisualizationContext } from '../../../types/visualization-context';

export function k33FlipVertex2And5_HideAffectedEdges(context: VisualizationContext): void {
  const affectedEdges = ['2,4', '2,5', '2,6', '1,5', '3,5'];
  affectedEdges.forEach((edgeId) => {
    const edge = context.edges.get(edgeId);
    if (edge) {
      context.scene.remove(edge.line);
      context.edges.delete(edgeId);
    }
  });
}
