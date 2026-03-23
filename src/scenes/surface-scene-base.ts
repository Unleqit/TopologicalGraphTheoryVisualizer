import { Material, Mesh, Scene, Vector3 } from 'three';
import { EmbeddingInstance } from './surface-scene/visualization/embedding-instance';
import { _3DGraphVertex } from '../graph/types/graph-3d-vertex';
import { GraphEdge } from '../graph/types/graph-edge';
import { VisualizationStep } from './surface-scene/visualization/types/visualization-step';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { VisualizationContext } from './surface-scene/visualization/visualization-context';
import { ISurfaceScene } from './surface-scene/isurface-scene';
import { UpdateUIFunction } from './surface-scene/visualization/types/update-ui-function';

export abstract class SurfaceSceneBase implements ISurfaceScene {
  private embedding: EmbeddingInstance;
  private initialXScale: number;
  private initialYScale: number;

  constructor(
    scene: Scene,
    mat: Material,
    vertices: _3DGraphVertex[],
    edges: GraphEdge[],
    edgeSegmentCount: number,
    steps: VisualizationStep[],
    coordinateTransformFunction: (u: number, v: number, target: Vector3, xScale?: number, yScale?: number) => void,
    morphFunction: (u: number, v: number, target: Vector3, morph: number, xScale?: number, yScale?: number) => void,
    updateUIFunction: UpdateUIFunction,
    reorderingAnimationDuration: number,
    pauseDuration: number,
    morphingAnimationDuration: number,
    initialXScale: number = 1.5,
    initialYSCale: number = 1.5
  ) {
    this.initialXScale = initialXScale;
    this.initialYScale = initialYSCale;

    const patchedCoordinateTransformationFunction = this.patchCoordinateTransformationFunction(coordinateTransformFunction);
    const patchedMorphFunction = this.patchMorphFunction(morphFunction);
    const geo = new ParametricGeometry(patchedMorphFunction, 80, 60);
    const mesh = new Mesh(geo, mat);
    const context = new VisualizationContext(scene, mesh, patchedCoordinateTransformationFunction, patchedMorphFunction, updateUIFunction, this.initialXScale, this.initialYScale);

    this.embedding = new EmbeddingInstance(context, vertices, edges, edgeSegmentCount, steps, reorderingAnimationDuration, pauseDuration, morphingAnimationDuration);
  }

  public setVisible(visible: boolean): void {
    this.embedding.setVisible(visible);
  }

  public autoUpdate(t: number): void {
    this.embedding.autoUpdate(t);
  }

  public updateGraphEmbedding(t: number, automatic: boolean = true): void {
    this.embedding.updateGraphEmbedding(t, automatic);
  }

  public updateShape(t: number, automatic: boolean = true): void {
    this.embedding.updateShape(t, automatic);
  }

  private patchMorphFunction(fn: (u: number, v: number, p: Vector3, morph: number, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => {
      fn(u, v, p, this.embedding?.context.morph ?? 0, this.embedding?.context.meshXScale ?? this.initialXScale, this.embedding?.context.meshYScale ?? this.initialYScale);
    };
  }

  private patchCoordinateTransformationFunction(fn: (u: number, v: number, p: Vector3, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => {
      fn(u, v, p, this.embedding?.context.meshXScale ?? this.initialXScale, this.embedding?.context.meshYScale ?? this.initialYScale);
    };
  }
}
