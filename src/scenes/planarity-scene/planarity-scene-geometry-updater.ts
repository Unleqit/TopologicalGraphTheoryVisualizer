import { Vector3 } from 'three';
import { Graph } from '../../graph/types/graph';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-scene-graph-rendering-result';
import { PlanaritySceneBase } from './planarity-scene-base';
import { PlanaritySceneGraphNode } from './types/planarity-scene-graph-node';

export class PlanaritySceneGeometryUpdater {
  constructor(private readonly sceneBase: PlanaritySceneBase) {}

  public updateVertexPosition(vertex: PlanaritySceneGraphNode, newPos: Vector3, graph: Graph, rendering: PlanarityPageGraphRenderingResult): void {
    this.updateVertex(vertex, newPos, graph);
    this.updateEdgesConnectedToVertex(vertex, rendering);
  }

  private updateVertex(vertex: PlanaritySceneGraphNode, newPos: Vector3, graph: Graph): void {
    vertex.mesh.position.copy(newPos);
    vertex.label.position.copy(newPos);

    const selectedVertex = graph.nodes.find((v) => v.id === vertex.id);
    if (selectedVertex) {
      selectedVertex.x = newPos.x;
      selectedVertex.y = newPos.y;
    }
  }

  private updateEdgesConnectedToVertex(vertex: PlanaritySceneGraphNode, rendering: PlanarityPageGraphRenderingResult): void {
    const nodeIdMap = new Map(rendering.nodeMeshes.map((nodeMesh) => [nodeMesh.id, nodeMesh]));

    rendering.edgeLines.forEach((edge) => {
      const [aIndex, bIndex] = (edge.id as string).split(',').map(Number);

      if (aIndex !== vertex.id && bIndex !== vertex.id) {
        return;
      }

      const nodeA = nodeIdMap.get(aIndex)!.mesh;
      const nodeB = nodeIdMap.get(bIndex)!.mesh;

      if (!nodeA || !nodeB) {
        return;
      }

      const posAttr = edge.line.geometry.getAttribute('position');

      posAttr.setXYZ(0, nodeA.position.x, nodeA.position.y, nodeA.position.z);
      posAttr.setXYZ(1, nodeB.position.x, nodeB.position.y, nodeB.position.z);
      posAttr.needsUpdate = true;
    });
  }
}
