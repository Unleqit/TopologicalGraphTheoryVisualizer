import { Vector3, MeshBasicMaterial } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { _3DGraphVertex } from '../../../../../../graph/graph-3d-vertex';
import { GraphEdge } from '../../../../../../graph/graph-edge';
import { VisualizationContext } from '../../../types/visualization-context';
import { K33_EDGE_SEGMENTS } from '../../k33-definition';
import { addShadowElements } from '../../../helpers/add-shadow-elements';

export function k33RerouteEdge34_RedrawAffectedEdge(context: VisualizationContext): void {
  const shadowVertices: _3DGraphVertex[] = [
    { position: new Vector3(), vertex: { id: 7, x: 1, y: 0.15 } },
    { position: new Vector3(), vertex: { id: 8, x: 0, y: 0.85 } },
  ];
  const shadowEdges: GraphEdge[] = [
    [3, 7],
    [4, 8],
  ];
  addShadowElements(context, shadowVertices, shadowEdges, new MeshBasicMaterial(), false, true);

  for (const v of context.vertices.values()) {
    const gv = v.data;
    const p = new Vector3();
    context.coordinateTransformFunction(gv.vertex.x, gv.vertex.y, p);
    v.mesh.position.copy(p);
  }

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
    e.line.visible = true;
    e.visible = true;
  }
}
