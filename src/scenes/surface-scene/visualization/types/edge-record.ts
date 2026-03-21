import { Line } from 'three';
import { VertexRecord } from './vertex-record';

export type EdgeRecord = { id: string; v0: VertexRecord; v1: VertexRecord; line: Line; isShadow: boolean; visible: boolean };
