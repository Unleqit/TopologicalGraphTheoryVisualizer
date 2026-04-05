import { Graph } from '../../../graph/types/graph';
import { GraphEdge } from '../../../graph/types/graph-edge';
import { GraphNode } from '../../../graph/types/graph.node';
import { PlanarityPageInputMatrix } from './planarity-page-input-matrix';

export class PlanarityPageInputConverter {
  public inputMatrixToGraph(matrix: PlanarityPageInputMatrix): Graph {
    const n = matrix.length;
    const edges: GraphEdge[] = [];

    for (let i = 0; i < n; ++i) {
      for (let j = i + 1; j < n; ++j) {
        if (matrix[i][j] !== 0) {
          edges.push([i, j]);
        }
      }
    }

    return { nodes: Array.from({ length: n }, (v: number): GraphNode => ({ id: v, x: -1, y: -1 })), edges: edges };
  }

  public graphToInputMatrix(graph: Graph): PlanarityPageInputMatrix {
    const matrix = Array.from({ length: graph.nodes.length }, () => Array(graph.nodes.length).fill(0));
    graph.edges.forEach((edge) => (matrix[edge[0]][edge[1]] = matrix[edge[1]][edge[0]] = 1));
    return matrix;
  }
}
