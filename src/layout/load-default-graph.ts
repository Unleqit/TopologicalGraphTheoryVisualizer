import { combinatorialEmbeddingToPosStepWise } from '../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { DIAMOND1 } from '../default-graph';
import { GraphEmbeddingStepResult } from '../graph/graph-embedding-step-result';
import { matrixToEdgeList } from '../graph/graph-utils';
import { graphLayoutService } from './index';

export async function loadDefaultGraph(): Promise<GraphEmbeddingStepResult | undefined> {
  const { nodeCount, edges } = matrixToEdgeList(DIAMOND1);
  const embeddingResult = await graphLayoutService.compute(edges, nodeCount);

  if (!embeddingResult.planar) {
    console.warn('Default graph is not planar');
    return;
  }

  const result = combinatorialEmbeddingToPosStepWise(edges, embeddingResult.canonical_ordering);
  return result;
}
