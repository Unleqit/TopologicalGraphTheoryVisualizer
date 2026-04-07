import { Vector3 } from 'three';
import { GraphEdge } from '../../graph/types/graph-edge';
import { GraphNode } from '../../graph/types/graph.node';
import { Graph } from '../../graph/types/graph';

export class PlanarityPageGraphBuilder {
  public addVertices(graph: Graph, ...vertices: Vector3[]): Graph {
    const nextNodeId = this.getNextNodeId(graph);
    const newNodes = vertices.map((vertex, index): GraphNode => {
      return { id: nextNodeId + index, x: vertex.x, y: vertex.y };
    });
    return this.add(graph, newNodes, []);
  }

  public addEdges(graph: Graph, ...vertexPairs: [number, number][]): Graph {
    const newEdges = vertexPairs.map((vp): GraphEdge => ({ id: `${Math.min(vp[0], vp[1])},${Math.max(vp[0], vp[1])}`, value: [vp[0], vp[1]] }));
    return this.add(graph, [], newEdges);
  }

  public add(graph: Graph, nodes: GraphNode[], edges: GraphEdge[]): Graph {
    const clone = this.cloneGraph(graph);
    return { nodes: [...clone.nodes, ...nodes], edges: [...clone.edges, ...edges] };
  }

  public cloneGraph(graph: Graph): Graph {
    return {
      nodes: graph.nodes.map((node): GraphNode => ({ id: node.id, x: node.x, y: node.y })),
      edges: graph.edges.map((edge): GraphEdge => ({ id: edge.id, value: edge.id.split(',').map(Number) as [number, number] })),
    };
  }

  public removeVertices(graph: Graph, ...removed: GraphNode[]): Graph {
    const removedMap = new Map(removed.map((vertex) => [vertex.id, vertex]));
    const clone = this.cloneGraph(graph);

    //account for holes in the vertex id range by shifting next vertices
    const remaining = clone.nodes.filter((node) => !removedMap.has(node.id));

    const idMap = new Map<number, number>();
    remaining.forEach((node, newIndex) => {
      idMap.set(node.id, newIndex);
    });

    clone.nodes = remaining.map((node, newIndex) => ({ ...node, id: newIndex }));
    clone.edges = clone.edges
      .filter((edge) => !removedMap.has(edge.value[0]) && !removedMap.has(edge.value[1]))
      .map((edge) => {
        const newA = idMap.get(edge.value[0])!;
        const newB = idMap.get(edge.value[1])!;
        return { ...edge, id: `${newA},${newB}`, value: [newA, newB] as [number, number] };
      });
    return clone;
  }

  public removeEdges(graph: Graph, ...removed: GraphEdge[]): Graph {
    const removedMap = new Map(removed.map((edge) => [edge.id, edge]));
    const clone = this.cloneGraph(graph);
    clone.edges = clone.edges.filter((edge) => !removedMap.has(edge.id));
    return clone;
  }

  private getNextNodeId(graph: Graph): number {
    return graph.nodes.length;
  }
}
