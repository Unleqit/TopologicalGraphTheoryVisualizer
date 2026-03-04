import { combinatorialEmbeddingToPosStepWise } from '../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { DIAMOND1 } from '../default-graph';
import { GraphEmbeddingStepResult } from '../graph/graph-embedding-result';
import { matrixToEdgeList } from '../graph/graph-utils';
import { GraphNode } from '../graph/graph.node';
import { graphLayoutService } from './index';

export async function loadDefaultGraph(): Promise<GraphEmbeddingStepResult | undefined> {
  const { nodeCount, edges } = matrixToEdgeList(DIAMOND1);
  const layout = await graphLayoutService.compute(edges, nodeCount);

  if (!layout.planar) {
    console.warn('Default graph is not planar');
    return;
  }

  const result = combinatorialEmbeddingToPosStepWise(edges, layout.canonical_ordering);
  return result;
}

//------------------------------------------------------------------------------------
