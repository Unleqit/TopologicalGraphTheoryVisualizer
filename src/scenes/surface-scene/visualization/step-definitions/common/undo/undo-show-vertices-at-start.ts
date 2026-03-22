import { VisualizationContext } from '../../../visualization-context';

export function _undoShowVerticesAtStart(context: VisualizationContext): void {
  [...context.vertices.values()].forEach((vertex) => {
    context.scene.remove(vertex.mesh);
  });
}
