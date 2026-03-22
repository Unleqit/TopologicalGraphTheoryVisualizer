import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { EmbeddingInstance } from './visualization/embedding-instance';
import { square } from './coordinate-transformation-functions/square';
import { squareCylinderSphere } from './coordinate-transformation-functions/square-cylinder-sphere';
import { VisualizationContext } from './visualization/visualization-context';
import { VisualizationContextUpdateUISource } from './visualization/types/visualization-context-ui-update-source';
import { VisualizationStep } from './visualization/types/visualization-step';
import { K3_EDGE_SEGMENTS, k3Edges, k3Vertices } from './visualization/step-definitions/k3/k3-definition';
import { showVerticesAtStart } from './visualization/step-definitions/common/redo/redo-show-vertices-at-start';
import { _undoShowVerticesAtStart } from './visualization/step-definitions/common/undo/undo-show-vertices-at-start';
import { showEdgesAtStart } from './visualization/step-definitions/common/redo/redo-show-edges-at-start';
import { _undoShowEdgesAtStart } from './visualization/step-definitions/common/undo/undo-show-edges-at-start';
import { Scene, MeshStandardMaterial, DoubleSide, Mesh, Vector3 } from 'three';

export class SurfaceSceneSphere {
  private EmbeddingInstance: EmbeddingInstance;
  private initialXScale: number;
  private initialYScale: number;

  constructor(scene: Scene, updateUIFunction: (value: number, source: VisualizationContextUpdateUISource) => void) {
    this.initialXScale = 1.5;
    this.initialYScale = 1.5;

    const patchedCoordinateTransformationFunction = this.patchCoordinateTransformationFunction(square);
    const patchedMorphFunction = this.patchMorphFunction(squareCylinderSphere);

    const mat = new MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: DoubleSide });
    const torusGeo = new ParametricGeometry(patchedMorphFunction, 80, 60);
    const mesh = new Mesh(torusGeo, mat);
    const context = new VisualizationContext(scene, mesh, patchedCoordinateTransformationFunction, patchedMorphFunction, updateUIFunction, this.initialXScale, this.initialYScale);

    const steps: VisualizationStep[] = [
      { description: '0', stepNumber: 0, redo: showVerticesAtStart, undo: _undoShowVerticesAtStart },
      { description: '1', stepNumber: 1, redo: showEdgesAtStart, undo: _undoShowEdgesAtStart },
    ];

    this.EmbeddingInstance = new EmbeddingInstance(context, k3Vertices, k3Edges, K3_EDGE_SEGMENTS, steps, 2, 1, 3);
  }

  public setVisible(visible: boolean): void {
    this.EmbeddingInstance.setVisible(visible);
  }

  public autoUpdate(t: number): void {
    this.EmbeddingInstance.autoUpdate(t);
  }

  public updateGraphEmbedding(t: number, automatic: boolean = true): void {
    this.EmbeddingInstance.updateGraphEmbedding(t, automatic);
  }

  public updateShape(t: number, automatic: boolean = true): void {
    this.EmbeddingInstance.updateShape(t, automatic);
  }

  private patchMorphFunction(fn: (u: number, v: number, p: Vector3, morph: number, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => {
      fn(
        u,
        v,
        p,
        this.EmbeddingInstance?.context.morph ?? 0,
        this.EmbeddingInstance?.context.meshXScale ?? this.initialXScale,
        this.EmbeddingInstance?.context.meshYScale ?? this.initialYScale
      );
    };
  }

  private patchCoordinateTransformationFunction(fn: (u: number, v: number, p: Vector3, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => {
      fn(u, v, p, this.EmbeddingInstance?.context.meshXScale ?? this.initialXScale, this.EmbeddingInstance?.context.meshYScale ?? this.initialYScale);
    };
  }
}
