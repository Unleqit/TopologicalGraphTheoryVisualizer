import { Vector3 } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { K33_EDGE_SEGMENTS } from '../k33/k33-definition';
import { VisualizationContext } from '../types/visualization-context';

export function redrawEdges(context: VisualizationContext, setVisibility: boolean = false, visibility: boolean = true): void {
  for (const e of context.edges.values()) {
    const v0 = e.v0.data.vertex;
    const v1 = e.v1.data.vertex;
    const pos = e.line.geometry.attributes.position;

    for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
      const t = j / K33_EDGE_SEGMENTS;
      const u = lerp(v0.x, v1.x, t);
      const v = lerp(v0.y, v1.y, t);
      const p = new Vector3();
      context.coordinateTransformFunction(u, v, p);
      pos.setXYZ(j, p.x, p.y, p.z);
    }

    pos.needsUpdate = true;
    if (setVisibility) {
      e.line.visible = visibility;
      e.visible = visibility;
    }
  }
}
