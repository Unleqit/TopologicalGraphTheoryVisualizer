import { GraphEdge } from './graph-edge';
import { GraphNode } from './graph.node';

export type GraphEmbeddingResult = {
  planar: boolean;
  nodes: GraphNode[];
  edges: GraphEdge[];
};
