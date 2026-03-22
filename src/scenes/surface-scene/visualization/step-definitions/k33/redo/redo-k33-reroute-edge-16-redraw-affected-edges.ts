import { Vector3, MeshBasicMaterial, Mesh } from 'three';
import { _3DGraphVertex } from '../../../../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../../../../graph/types/graph-edge';
import { VisualizationContext } from '../../../visualization-context';
import { addShadowElements } from '../../../helpers/add-shadow-elements';
import { redrawEdgeRecords } from '../../../helpers/redraw-edge-records';
import { redrawVertexRecords } from '../../../helpers/redraw-vertex-records';

export function k33RerouteEdge16_RedrawAffectedEdge(context: VisualizationContext): void {
  const shadowVertices: _3DGraphVertex[] = [
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 9, x: 0, y: 0.5 } },
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 10, x: 1, y: 0.5 } },
  ];
  const shadowEdges: GraphEdge[] = [
    [1, 9],
    [6, 10],
  ];
  addShadowElements(context, shadowVertices, shadowEdges, new MeshBasicMaterial(), false, true);
  redrawVertexRecords(context, context.coordinateTransformFunction);
  redrawEdgeRecords(context, context.coordinateTransformFunction);
}
