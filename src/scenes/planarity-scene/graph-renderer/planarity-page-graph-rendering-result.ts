import { Group } from 'three/src/Three.js';
import { PlanarityPageGraphNode } from '../types/planarity-page-graph-node';
import { PlanarityPageGraphEdge } from '../types/planarity-page-graph-edge';
import { Graph } from '../../../graph/types/graph';

export type PlanarityPageGraphRenderingResult = {
  startTimestamp: number;
  graph: Graph;
  graphGroup: Group;
  nodeMeshes: PlanarityPageGraphNode[];
  edgeLines: PlanarityPageGraphEdge[];
};
