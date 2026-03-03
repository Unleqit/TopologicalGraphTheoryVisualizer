import { DIAMOND1 } from '../default-graph';
import { GraphEdge } from '../graph/graph-edge';
import { matrixToEdgeList } from '../graph/graph-utils';
import { GraphNode } from '../graph/graph.node';
import { graphLayoutService } from './index';

export async function loadDefaultGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const { nodeCount, edges } = matrixToEdgeList(DIAMOND1);
  const layout = await graphLayoutService.compute(edges, nodeCount);

  if (!layout.planar) {
    console.warn('Default graph is not planar');
  }

  return { nodes: layout.nodes, edges: layout.edges };
}
