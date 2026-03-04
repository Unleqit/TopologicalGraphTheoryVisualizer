import { combinatorialEmbeddingToPos2 } from '../algorithms/chrobak-payne/chrobak-payne-step-wise';
import { DIAMOND1 } from '../default-graph';
import { GraphEmbeddingResult, GraphEmbeddingStepResult } from '../graph/graph-embedding-result';
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

  const result = combinatorialEmbeddingToPos2(layout.canonical_ordering);
  const nodeSteps = result.map((step) => Object.entries(step).map(([id, [x, y]]): GraphNode => ({ id: parseInt(id), x, y })));
  const edgeSteps = nodeSteps.map((nodes) => {
    const idSet = new Set(nodes.map((n) => n.id));
    return edges.filter(([u, v]) => idSet.has(u) && idSet.has(v));
  });

  return { planar: true, nodes: nodeSteps, edges: edgeSteps };
}

//------------------------------------------------------------------------------------
