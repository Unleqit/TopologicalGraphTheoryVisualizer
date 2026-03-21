import { removeEdge } from '../../../helpers/remove-edge';
import { VisualizationContext } from '../../../types/visualization-context';

export function k33RerouteEdge16_HideAffectedEdge(context: VisualizationContext): void {
  const edge = context.edges.get('1,6');
  if (edge) {
    removeEdge(context, edge);
  }
}
