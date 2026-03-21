import { Vector3 } from 'three';
import { VisualizationContext } from '../types/visualization-context';

export function redrawVertices(context: VisualizationContext, setVisibility: boolean = false, visibility: boolean = true): void {
  for (const v of context.vertices.values()) {
    const gv = v.data;
    const p = new Vector3();
    context.coordinateTransformFunction(gv.vertex.x, gv.vertex.y, p);
    v.mesh.position.copy(p);
    if (setVisibility) {
      v.mesh.visible = visibility;
      v.visible = visibility;
    }
  }
}
