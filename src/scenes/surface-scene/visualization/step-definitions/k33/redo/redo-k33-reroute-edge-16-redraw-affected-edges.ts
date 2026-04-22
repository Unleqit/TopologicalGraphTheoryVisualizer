import { Vector3, MeshBasicMaterial, Mesh } from 'three';
import { _3DGraphVertex } from '../../../../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../../../../graph/types/graph-edge';
import { SurfaceSceneBase } from '../../../../surface-scene-base';
import { addShadowElements } from '../../../helpers/add-shadow-elements';
import { redrawEdgeRecords } from '../../../helpers/edge-records/redraw-edge-records';
import { redrawVertexRecords } from '../../../helpers/vertex-records/redraw-vertex-records';

export function k33RerouteEdge16_RedrawAffectedEdge(context: SurfaceSceneBase): void {
  const shadowVertices: _3DGraphVertex[] = [
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 9, x: 0, y: 0.5 } },
    { position: new Vector3(), mesh: new Mesh(), vertex: { id: 10, x: 1, y: 0.5 } },
  ];
  const shadowEdges: GraphEdge[] = [
    { id: '1,9', value: [1, 9] },
    { id: '6,10', value: [6, 10] },
  ];
  addShadowElements(context, shadowVertices, shadowEdges, new MeshBasicMaterial(), false, true);
  redrawVertexRecords(context, context.coordinateTransformFunction);
  redrawEdgeRecords(context, context.coordinateTransformFunction);
}
