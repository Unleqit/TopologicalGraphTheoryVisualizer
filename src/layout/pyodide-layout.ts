import { combinatorialEmbeddingToPos } from '../algorithms/chrobak-payne/chrobak-payne';
import { GraphEmbeddingResult } from '../graph/graph-embedding-result';
import { GraphNode } from '../graph/graph.node';
import { graphLayoutService } from './index';

export async function computeLayout(edges: [number, number][], nodeCount: number): Promise<GraphEmbeddingResult | undefined> {
  const layout = await graphLayoutService.compute(edges, nodeCount);

  if (!layout.planar) {
    console.warn('Graph is not planar');
    return;
  }

  const result = combinatorialEmbeddingToPos(layout.canonical_ordering);
  const nodes = Object.entries(result).map(([id, [x, y]]): GraphNode => ({ id: parseInt(id), x, y }));

  return { planar: true, nodes: nodes, edges: edges, canonical_ordering: result };
}
