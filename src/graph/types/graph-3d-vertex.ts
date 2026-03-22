import { Mesh, Vector3 } from 'three';
import { GraphNode } from './graph.node';

export type _3DGraphVertex = { vertex: GraphNode; position: Vector3; mesh: Mesh };
