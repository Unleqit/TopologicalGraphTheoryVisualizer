import { Vector3, MeshBasicMaterial, Mesh } from 'three';
import { _3DGraphVertex } from '../../../../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../../../../graph/types/graph-edge';
import { VisualizationContext } from '../../../visualization-context';
import { addShadowElements } from '../../../helpers/add-shadow-elements';
import { redrawVertexRecords } from '../../../helpers/vertex-records/redraw-vertex-records';
import { redrawEdgeRecords } from '../../../helpers/edge-records/redraw-edge-records';

export function k33RerouteEdge25_RedrawAffectedEdge(context: VisualizationContext): void {
  const shadowVertices: _3DGraphVertex[] = [
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 7, x: 0.5, y: 1 } },
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 8, x: 0.5, y: 0 } },
  ];
  const shadowEdges: GraphEdge[] = [
    [2, 7],
    [5, 8],
  ];
  addShadowElements(context, shadowVertices, shadowEdges, new MeshBasicMaterial(), false, true);
  redrawVertexRecords(context, context.coordinateTransformFunction);
  redrawEdgeRecords(context, context.coordinateTransformFunction);
}
