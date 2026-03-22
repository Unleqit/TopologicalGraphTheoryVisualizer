import { Material, MeshBasicMaterial } from 'three';
import { _3DGraphVertex } from '../../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../../graph/types/graph-edge';
import { createVertexMesh, createEdgeLine } from '../../../utils';
import { EdgeRecord } from '../types/edge-record';
import { VertexRecord } from '../types/vertex-record';
import { VisualizationContext } from '../visualization-context';

export function addShadowElements(
  context: VisualizationContext,
  shadowVertices: _3DGraphVertex[],
  shadowEdges: GraphEdge[],
  mat: Material = new MeshBasicMaterial({ visible: false }),
  verticesVisible: boolean = false,
  edgesVisible: boolean = true
): void {
  const shadowVertexMeshes = shadowVertices.map(() => createVertexMesh(mat, verticesVisible));
  const shadowEdgeLines = shadowEdges.map(() => createEdgeLine(context.edgeSegmentCount, edgesVisible));

  for (let i = 0; i < shadowVertices.length; i++) {
    const gv = shadowVertices[i];
    const mesh = shadowVertexMeshes[i];
    const record: VertexRecord = { id: gv.vertex.id, data: gv, mesh, isShadow: true, visible: verticesVisible };
    context.vertices.set(record.id, record);
    context.scene.add(mesh);
  }

  for (let i = 0; i < shadowEdges.length; i++) {
    const line = shadowEdgeLines[i];
    const a = context.vertices.get(shadowEdges[i][0]);
    const b = context.vertices.get(shadowEdges[i][1]);
    if (a && b) {
      const min = a.id < b.id ? a.id : b.id;
      const max = a.id > b.id ? a.id : b.id;
      const record: EdgeRecord = { id: `${min},${max}`, isShadow: true, line: line, v0: a, v1: b, visible: edgesVisible };
      context.edges.set(record.id, record);
      context.scene.add(line);
    }
  }

  //add to scene
  for (const m of shadowVertexMeshes) {
    context.scene.add(m);
  }
  for (const l of shadowEdgeLines) {
    context.scene.add(l);
  }
}
