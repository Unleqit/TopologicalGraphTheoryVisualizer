import { Vector3 } from 'three';
import { GraphEdge } from '../../graph/types/graph-edge';
import { GraphNode } from '../../graph/types/graph.node';
import { PlanarityPageGraphRenderingResult } from './graph-renderer/planarity-page-graph-rendering-result';
import { PlanarityPageGraphNode } from './types/planarity-page-graph-node';
import { Graph } from '../../graph/types/graph';

export class PlanarityPageGraphBuilder {
  public addVertices(rendering: PlanarityPageGraphRenderingResult, ...vertices: Vector3[]): Graph {
    const nextNodeId = this.getNextNodeId(rendering);
    const newNodes = vertices.map((vertex, index): GraphNode => {
      const local = rendering.graphGroup.worldToLocal(vertex.clone());
      return { id: nextNodeId + index, x: local.x, y: local.y };
    });
    return this.add(rendering, newNodes, []);
  }

  public addEdges(rendering: PlanarityPageGraphRenderingResult, ...vertexPairs: [PlanarityPageGraphNode, PlanarityPageGraphNode][]): Graph {
    const newEdges = vertexPairs.map((vp): GraphEdge => [Math.min(vp[0].id, vp[1].id), Math.max(vp[0].id, vp[1].id)]);
    return this.add(rendering, [], newEdges);
  }

  public add(rendering: PlanarityPageGraphRenderingResult, nodes: GraphNode[], edges: GraphEdge[]): Graph {
    const allNodes: GraphNode[] = [...rendering.nodeMeshes.map((n) => ({ id: n.id, x: n.mesh.position.x, y: n.mesh.position.y })), ...nodes];
    const allEdges: GraphEdge[] = [...rendering.edgeLines.map((e) => e.id.split(',').map(Number) as GraphEdge), ...edges];
    return { nodes: allNodes, edges: allEdges };
  }

  private getNextNodeId(rendering: PlanarityPageGraphRenderingResult): number {
    return rendering.graph.nodes.length;
  }
}
