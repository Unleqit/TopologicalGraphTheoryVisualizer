import { computeGraph, EmbeddingResult } from './graphWorker';

export async function computeLayout(edges: [number, number][], nodeCount: number): Promise<EmbeddingResult> {
  return await computeGraph(edges, nodeCount);
}
