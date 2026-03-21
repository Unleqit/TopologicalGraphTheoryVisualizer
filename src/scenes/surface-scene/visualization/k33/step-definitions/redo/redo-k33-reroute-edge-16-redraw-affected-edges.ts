import { Vector3, MeshBasicMaterial } from 'three';
import { _3DGraphVertex } from '../../../../../../graph/graph-3d-vertex';
import { GraphEdge } from '../../../../../../graph/graph-edge';
import { redrawVertices } from '../../../helpers/redraw-vertices';
import { VisualizationContext } from '../../../types/visualization-context';
import { addShadowElements } from '../../../helpers/add-shadow-elements';
import { redrawEdges } from '../../../helpers/redraw-edges';

export function k33RerouteEdge16_RedrawAffectedEdge(context: VisualizationContext): void {
  const shadowVertices: _3DGraphVertex[] = [
    { position: new Vector3(), vertex: { id: 9, x: 0, y: 0.5 } },
    { position: new Vector3(), vertex: { id: 10, x: 1, y: 0.5 } },
  ];
  const shadowEdges: GraphEdge[] = [
    [1, 9],
    [6, 10],
  ];
  addShadowElements(context, shadowVertices, shadowEdges, new MeshBasicMaterial(), false, true);
  redrawVertices(context);
  redrawEdges(context);
}
