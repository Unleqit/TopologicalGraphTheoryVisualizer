import { VisualizationContext } from '../../../visualization-context';

export function _undoK33FlipVertex2And5_FlipVertices(context: VisualizationContext): void {
  const v2 = context.vertices.get(2);
  const v5 = context.vertices.get(5);

  if (!v2 || !v5) {
    return;
  }

  const tmp = v2.mesh.position.clone();
  v2.mesh.position.copy(v5.mesh.position);
  v5.mesh.position.copy(tmp);
  v2.mesh.geometry.attributes.position.needsUpdate = true;
  v5.mesh.geometry.attributes.position.needsUpdate = true;

  const tmpData = v2.data;
  v2.data = v5.data;
  v5.data = tmpData;
}
