import { GraphEmbeddingResult } from './graph/graph-embedding-result';
import { graphLayoutService } from './layout/index';

export async function computeLayout(edges: [number, number][], nodeCount: number): Promise<GraphEmbeddingResult> {
  return await graphLayoutService.compute(edges, nodeCount);
}
