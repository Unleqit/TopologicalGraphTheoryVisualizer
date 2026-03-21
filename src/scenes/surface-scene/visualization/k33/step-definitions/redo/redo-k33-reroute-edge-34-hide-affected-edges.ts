import { removeEdge } from '../../../helpers/remove-edge';
import { VisualizationContext } from '../../../types/visualization-context';

export function k33RerouteEdge34_HideAffectedEdge(context: VisualizationContext): void {
  const edge = context.edges.get('3,4');
  if (edge) {
    removeEdge(context, edge);
  }
}
