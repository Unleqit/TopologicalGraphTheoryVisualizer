import { combinatorialEmbeddingToPos } from '../algorithms/chrobak-payne/chrobak-payne';
import { DIAMOND1 } from '../default-graph';
import { GraphEmbeddingResult } from '../graph/graph-embedding-result';
import { matrixToEdgeList } from '../graph/graph-utils';
import { GraphNode } from '../graph/graph.node';
import { graphLayoutService } from './index';

export async function loadDefaultGraph(): Promise<GraphEmbeddingResult | undefined> {
  const { nodeCount, edges } = matrixToEdgeList(DIAMOND1);
  const layout = await graphLayoutService.compute(edges, nodeCount);

  if (!layout.planar) {
    console.warn('Default graph is not planar');
    return;
  }

  const result = combinatorialEmbeddingToPos(layout.canonical_ordering);
  const nodes = Object.entries(result).map(([id, [x, y]]): GraphNode => ({ id: parseInt(id), x, y }));

  return { planar: true, nodes: nodes, edges: edges, canonical_ordering: result };
}

//------------------------------------------------------------------------------------
