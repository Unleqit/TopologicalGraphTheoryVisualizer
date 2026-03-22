import { Vector3 } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { VisualizationContext } from '../visualization-context';

export function redrawEdgeRecords(
  context: VisualizationContext,
  coordinateTransformFunction: (u: number, v: number, p: Vector3) => void,
  setVisibility: boolean = false,
  visibility: boolean = true
): void {
  for (const e of context.edges.values()) {
    const v0 = e.v0.data.vertex;
    const v1 = e.v1.data.vertex;

    const positions: number[] = [];

    for (let j = 0; j <= context.edgeSegmentCount; j++) {
      const t = j / context.edgeSegmentCount;

      const u = lerp(v0.x, v1.x, t);
      const v = lerp(v0.y, v1.y, t);

      const p = new Vector3();
      coordinateTransformFunction(u, v, p);

      positions.push(p.x, p.y, p.z);
    }

    e.line.geometry.setPositions(positions);

    if (setVisibility) {
      e.line.visible = visibility;
      e.visible = visibility;
    }
  }
}
