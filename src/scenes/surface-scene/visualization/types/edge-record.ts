import { VertexRecord } from './vertex-record';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';

export type EdgeRecord = { id: string; v0: VertexRecord; v1: VertexRecord; line: Line2; isShadow: boolean; visible: boolean };
