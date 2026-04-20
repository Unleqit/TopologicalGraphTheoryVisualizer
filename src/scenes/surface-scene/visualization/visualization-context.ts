import { Scene, Object3D, Mesh, Vector3, DoubleSide, MeshStandardMaterial } from 'three';
import { EdgeRecord } from './types/edge-record';
import { VertexRecord } from './types/vertex-record';
import { UpdateUIFunction } from './types/update-ui-function';
import { addDefaultLights } from '../../../pages/utils';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { _3DGraphVertex } from '../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../graph/types/graph-edge';
import { createEdgeRecordsFromGraphEdges } from './helpers/edge-records/create-edge-records';
import { createVertexRecords } from './helpers/vertex-records/create-vertex-records';
import { redrawVertexRecords } from './helpers/vertex-records/redraw-vertex-records';
import { redrawEdgeRecords } from './helpers/edge-records/redraw-edge-records';

export class VisualizationContext {
  public readonly scene: Scene = new Scene();
  public mesh: Mesh;
  public morph: number = 0;
  public meshXScale: number = 1.5;
  public meshYScale: number = 1.5;
  public vertices: Map<number, VertexRecord> = new Map();
  public edges: Map<string, EdgeRecord> = new Map();
  public edgeSegmentCount: number = 0;
  public once: boolean[];
  public updateUIFunction: UpdateUIFunction;
  public coordinateTransformFunction: (u: number, v: number, p: Vector3) => void;
  public morphFunction: (u: number, v: number, p: Vector3) => void;

  constructor(
    vertices: _3DGraphVertex[],
    edges: GraphEdge[],
    edgeSegmentCount: number,
    coordinateTransformFunction: (u: number, v: number, target: Vector3, xScale?: number, yScale?: number) => void,
    morphFunction: (u: number, v: number, target: Vector3, morph: number, xScale?: number, yScale?: number) => void,
    updateUIFunction: UpdateUIFunction,
    once: number = 10,
    meshXScale: number = 1.5,
    meshYScale: number = 1.5
  ) {
    this.vertices = new Map(createVertexRecords(vertices).map((record) => [record.id, record]));
    this.edges = new Map(createEdgeRecordsFromGraphEdges(this.vertices, edges, edgeSegmentCount).map((record) => [record.id, record]));
    this.edgeSegmentCount = edgeSegmentCount;
    this.once = Array.from({ length: once }, () => false);
    this.meshXScale = meshXScale;
    this.meshYScale = meshYScale;

    this.coordinateTransformFunction = this.patchCoordinateTransformationFunction(coordinateTransformFunction);
    this.morphFunction = this.patchMorphFunction(morphFunction);
    this.updateUIFunction = updateUIFunction;

    const geo = new ParametricGeometry(this.morphFunction, 80, 60);
    this.mesh = new Mesh(geo, new MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: DoubleSide }));

    addDefaultLights(this.scene);
    this.scene.add(this.mesh);
  }

  private patchMorphFunction(fn: (u: number, v: number, p: Vector3, morph: number, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => fn(u, v, p, this.morph, this.meshXScale, this.meshYScale);
  }

  private patchCoordinateTransformationFunction(fn: (u: number, v: number, p: Vector3, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => fn(u, v, p, this.meshXScale, this.meshYScale);
  }

  public updateShape(normed: number): void {
    this.updateUIFunction({ description: '', normedStepValue: normed, stepValue: -1 }, 'transform');

    this.morph = normed;
    const newTorusGeo = new ParametricGeometry(this.morphFunction, 80, 60);
    this.mesh.geometry.dispose();
    this.mesh.geometry = newTorusGeo;

    redrawVertexRecords(this, this.morphFunction);
    redrawEdgeRecords(this, this.morphFunction, false);
  }
}
