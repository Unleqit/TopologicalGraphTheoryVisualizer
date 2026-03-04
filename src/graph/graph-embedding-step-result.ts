import { GraphEdge } from './graph-edge';
import { GraphNode } from './graph.node';

export type GraphEmbeddingStepResult = {
  planar: boolean;
  nodes: GraphNode[][];
  edges: GraphEdge[][];
};
