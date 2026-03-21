import { VisualizationContext } from '../../../types/visualization-context';

export function _undoK33RerouteEdge34_RedrawAffectedEdge(context: VisualizationContext): void {
  ['3,7', '4,8'].forEach((edgeId) => {
    const edge = context.edges.get(edgeId);
    if (edge) {
      context.scene.remove(edge.line);
      context.edges.delete(edgeId);
    }
  });

  const v7 = context.vertices.get(7);
  const v8 = context.vertices.get(8);

  if (!v7 || !v8) {
    return;
  }

  context.scene.remove(v7.mesh);
  context.scene.remove(v8.mesh);
}
