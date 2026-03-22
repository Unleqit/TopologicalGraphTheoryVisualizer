import { redrawVertexRecords } from '../../../helpers/redraw-vertex-records';
import { VisualizationContext } from '../../../visualization-context';

export function showVerticesAtStart(context: VisualizationContext): void {
  [...context.vertices.values()].forEach((vertex) => {
    context.scene.add(vertex.mesh);
  });
  redrawVertexRecords(context, context.coordinateTransformFunction, true, true);
}
