import { EdgeRecord } from '../types/edge-record';
import { VisualizationContext } from '../types/visualization-context';

export function removeEdge(context: VisualizationContext, edge: EdgeRecord): void {
  context.scene.remove(edge.line);
  edge.line.geometry.dispose();
  if (Array.isArray(edge.line.material)) {
    edge.line.material.forEach((m) => m.dispose());
  } else {
    edge.line.material.dispose();
  }
  context.edges.delete(edge.id);
}
