import { VisualizationContext } from '../../../types/visualization-context';

export function _undoK33RerouteEdge16_RedrawAffectedEdge(context: VisualizationContext): void {
  ['1,9', '6,10'].forEach((edgeId) => {
    const edge = context.edges.get(edgeId);
    if (edge) {
      context.scene.remove(edge.line);
      context.edges.delete(edgeId);
    }
  });

  const v9 = context.vertices.get(9);
  const v10 = context.vertices.get(10);

  if (!v9 || !v10) {
    return;
  }

  context.scene.remove(v9.mesh);
  context.scene.remove(v10.mesh);
}
