import { Group } from 'three/src/Three.js';
import { PlanarityPageGraphNode } from './planarity-page-graph-node';
import { PlanarityPageGraphEdge } from './planarity-page-graph-edge';

export type PlanarityPageGraphRenderingResult = { graphGroup: Group; nodeMeshes: PlanarityPageGraphNode[]; edgeLines: PlanarityPageGraphEdge[] };
