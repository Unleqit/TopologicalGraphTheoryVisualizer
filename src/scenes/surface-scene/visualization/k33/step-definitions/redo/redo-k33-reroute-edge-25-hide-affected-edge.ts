import { removeEdge } from '../../../helpers/remove-edge';
import { VisualizationContext } from '../../../types/visualization-context';

export function k33RerouteEdge25_HideAffectedEdge(context: VisualizationContext): void {
  const edge = context.edges.get('2,5');
  if (edge) {
    removeEdge(context, edge);
  }
}
