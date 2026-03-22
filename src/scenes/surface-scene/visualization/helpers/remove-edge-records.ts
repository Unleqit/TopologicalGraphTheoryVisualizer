import { VisualizationContext } from '../visualization-context';

export function removeEdgeRecordsByIDs(context: VisualizationContext, edgeIDs: string[]): void {
  edgeIDs.forEach((edgeId) => {
    const edge = context.edges.get(edgeId);
    if (edge) {
      context.scene.remove(edge.line);
      context.edges.delete(edgeId);
      edge.line.geometry.dispose();
      if (Array.isArray(edge.line.material)) {
        edge.line.material.forEach((m) => m.dispose());
      } else {
        edge.line.material.dispose();
      }
    }
  });
}
