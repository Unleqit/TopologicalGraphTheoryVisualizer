import { Vector3, MeshBasicMaterial, Mesh } from 'three';
import { _3DGraphVertex } from '../../../../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../../../../graph/types/graph-edge';
import { VisualizationContext } from '../../../visualization-context';
import { addShadowElements } from '../../../helpers/add-shadow-elements';
import { redrawVertexRecords } from '../../../helpers/vertex-records/redraw-vertex-records';
import { redrawEdgeRecords } from '../../../helpers/edge-records/redraw-edge-records';

export function k33RerouteEdge34_RedrawAffectedEdge(context: VisualizationContext): void {
  const shadowVertices: _3DGraphVertex[] = [
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 7, x: 1, y: 0.15 } },
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 8, x: 0, y: 0.85 } },
  ];
  const shadowEdges: GraphEdge[] = [
    { id: '3,7', value: [3, 7] },
    { id: '4,8', value: [4, 8] },
  ];
  addShadowElements(context, shadowVertices, shadowEdges, new MeshBasicMaterial(), false, true);
  redrawVertexRecords(context, context.coordinateTransformFunction);
  redrawEdgeRecords(context, context.coordinateTransformFunction);
}
