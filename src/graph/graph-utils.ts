import { GraphEdge } from './types/graph-edge';

export function matrixToEdgeList(matrix: number[][]): { nodeCount: number; edges: GraphEdge[] } {
  const n = matrix.length;
  const edges: GraphEdge[] = [];

  for (let i = 0; i < n; ++i) {
    for (let j = i + 1; j < n; ++j) {
      if (matrix[i][j] !== 0) {
        edges.push([i, j]);
      }
    }
  }

  return { nodeCount: n, edges };
}
