import { Scene, Object3D, Mesh, Vector3 } from 'three';
import { EdgeRecord } from './edge-record';
import { VertexRecord } from './vertex-record';

export class VisualizationContext {
  public scene: Scene;
  public objects: Object3D[] = [];
  public mesh: Mesh;
  public morph: number = 0;
  public meshXScale: number = 1.5;
  public meshYScale: number = 1.5;
  public vertices: Map<number, VertexRecord> = new Map();
  public edges: Map<string, EdgeRecord> = new Map();
  public once: boolean[];
  public updateUIFunction: (value: number) => void;
  public coordinateTransformFunction: (u: number, v: number, p: Vector3) => void;
  public morphFunction: (u: number, v: number, p: Vector3) => void;

  constructor(
    scene: Scene,
    mesh: Mesh,
    coordinateTransformFunction: (u: number, v: number, p: Vector3) => void,
    morphFunction: (u: number, v: number, p: Vector3) => void,
    updateUIFunction: (value: number) => void,
    once: number = 10,
    meshXScale: number = 1.5,
    meshYScale: number = 1.5
  ) {
    this.scene = scene;
    this.mesh = mesh;
    this.updateUIFunction = updateUIFunction;
    this.coordinateTransformFunction = coordinateTransformFunction;
    this.morphFunction = morphFunction;
    this.once = Array.from({ length: once }, () => false);
    this.meshXScale = meshXScale;
    this.meshYScale = meshYScale;
  }
}
