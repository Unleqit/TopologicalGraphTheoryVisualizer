import { VisualizationContext } from '../../visualization-context';

export function removeVertexRecordsByIDs(context: VisualizationContext, vertexIDs: number[]): void {
  vertexIDs.forEach((vertexID) => {
    const vertex = context.vertices.get(vertexID);
    if (vertex) {
      context.scene.remove(vertex.mesh);
      context.vertices.delete(vertex.id);
      vertex.mesh.geometry.dispose();
      if (Array.isArray(vertex.mesh.material)) {
        vertex.mesh.material.forEach((m) => m.dispose());
      } else {
        vertex.mesh.material.dispose();
      }
    }
  });
}
