import { MeshBasicMaterial } from 'three';
import { createLabeledVertexMesh } from '../../../utils';
import { k33Vertices } from './k33-definition';
import { VertexRecord } from '../types/vertex-record';
import { VisualizationContext } from '../types/visualization-context';

export function createK33TorusVertices(context: VisualizationContext): void {
  const matA = new MeshBasicMaterial({ color: 0xff8800, depthTest: false });
  const matB = new MeshBasicMaterial({ color: 0xaa00ff, depthTest: false });

  for (let i = 0; i < k33Vertices.length; i++) {
    const gv = k33Vertices[i];
    const mat = i < 3 ? matA : matB;
    const mesh = createLabeledVertexMesh(mat, gv, true);
    const record: VertexRecord = { id: gv.vertex.id, data: gv, mesh, isShadow: false, visible: true };
    context.vertices.set(record.id, record);
    context.scene.add(mesh);
  }
}
