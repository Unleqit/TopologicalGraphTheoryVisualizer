import { Group } from 'three/src/Three.js';
import { Graph } from '../../../graph/types/graph';
import { PlanaritySceneGraphEdge } from '../types/planarity-scene-graph-edge';
import { PlanaritySceneGraphNode } from '../types/planarity-scene-graph-node';

export type PlanarityPageGraphRenderingResult = {
  startTimestamp: number;
  graph: Graph;
  graphGroup: Group;
  nodeMeshes: PlanaritySceneGraphNode[];
  edgeLines: PlanaritySceneGraphEdge[];
};
