import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { EmbeddingInstance } from './visualization/embedding-instance';
import { square } from './coordinate-transformation-functions/square';
import { squareCylinderTorus } from './coordinate-transformation-functions/square-cylinder-torus';
import { VisualizationStep } from './visualization/types/visualization-step';
import { VisualizationContext } from './visualization/visualization-context';
import { k33Vertices, k33Edges, K33_EDGE_SEGMENTS } from './visualization/step-definitions/k33/k33-definition';
import { k33FlipVertex2And5_FlipVertices } from './visualization/step-definitions/k33/redo/redo-k33-flip-vertex-2-and-5-flip-vertices';
import { k33FlipVertex2And5_HideAffectedEdges } from './visualization/step-definitions/k33/redo/redo-k33-flip-vertex-2-and-5-hide-affected-edges';
import { k33FlipVertex2And5_RedrawAffectedEdges } from './visualization/step-definitions/k33/redo/redo-k33-flip-vertex-2-and-5-redraw-affected-edges';
import { k33RerouteEdge16_HideAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-16-hide-affected-edge';
import { k33RerouteEdge16_RedrawAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-16-redraw-affected-edges';
import { k33RerouteEdge25_HideAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-25-hide-affected-edge';
import { k33RerouteEdge25_RedrawAffectedEdge } from './visualization/step-definitions/k33/redo/redo-k33-reroute-edge-25-redraw-affected-edges';
import { _undoK33FlipVertex2And5_FlipVertices } from './visualization/step-definitions/k33/undo/undo-k33-flip-vertex-2-and-5-flip-vertices';
import { _undoK33FlipVertex2And5_HideAffectedEdges } from './visualization/step-definitions/k33/undo/undo-k33-flip-vertex-2-and-5-hide-affected-edges';
import { _undoK33FlipVertex2And5_RedrawAffectedEdges } from './visualization/step-definitions/k33/undo/undo-k33-flip-vertex-2-and-5-redraw-affected-edges';
import { _undoK33RerouteEdge16_HideAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-16-hide-affected-edge';
import { _undoK33RerouteEdge16_RedrawAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-16-redraw-affected-edges';
import { _undoK33RerouteEdge25_HideAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-25-hide-affected-edge';
import { _undoK33RerouteEdge25_RedrawAffectedEdge } from './visualization/step-definitions/k33/undo/undo-k33-reroute-edge-25-redraw-affected-edges';
import { VisualizationContextUpdateUISource } from './visualization/types/visualization-context-ui-update-source';
import { showVerticesAtStart } from './visualization/step-definitions/common/redo/redo-show-vertices-at-start';
import { _undoShowVerticesAtStart } from './visualization/step-definitions/common/undo/undo-show-vertices-at-start';
import { showEdgesAtStart } from './visualization/step-definitions/common/redo/redo-show-edges-at-start';
import { _undoShowEdgesAtStart } from './visualization/step-definitions/common/undo/undo-show-edges-at-start';
import { Scene, MeshStandardMaterial, DoubleSide, Mesh, Vector3 } from 'three';

export class SurfaceSceneTorus {
  private EmbeddingInstance: EmbeddingInstance;
  private initialXScale: number;
  private initialYScale: number;

  constructor(scene: Scene, updateUIFunction: (value: number, source: VisualizationContextUpdateUISource) => void) {
    //acquire context
    this.initialXScale = 1.5;
    this.initialYScale = 1.5;

    const patchedCoordinateTransformationFunction = this.patchCoordinateTransformationFunction(square);
    const patchedMorphFunction = this.patchMorphFunction(squareCylinderTorus);

    const mat = new MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: DoubleSide });
    const torusGeo = new ParametricGeometry(patchedMorphFunction, 80, 60);
    const mesh = new Mesh(torusGeo, mat);
    const context = new VisualizationContext(scene, mesh, patchedCoordinateTransformationFunction, patchedMorphFunction, updateUIFunction, this.initialXScale, this.initialYScale);

    const steps: VisualizationStep[] = [
      { description: '0', stepNumber: 0, redo: showVerticesAtStart, undo: _undoShowVerticesAtStart },
      { description: '1', stepNumber: 1, redo: showEdgesAtStart, undo: _undoShowEdgesAtStart },
      { description: '2', stepNumber: 2, redo: k33FlipVertex2And5_HideAffectedEdges, undo: _undoK33FlipVertex2And5_HideAffectedEdges },
      { description: '3', stepNumber: 3, redo: k33FlipVertex2And5_FlipVertices, undo: _undoK33FlipVertex2And5_FlipVertices },
      { description: '4', stepNumber: 4, redo: k33FlipVertex2And5_RedrawAffectedEdges, undo: _undoK33FlipVertex2And5_RedrawAffectedEdges },
      { description: '5', stepNumber: 5, redo: k33RerouteEdge25_HideAffectedEdge, undo: _undoK33RerouteEdge25_HideAffectedEdge },
      { description: '6', stepNumber: 6, redo: k33RerouteEdge25_RedrawAffectedEdge, undo: _undoK33RerouteEdge25_RedrawAffectedEdge },
      { description: '7', stepNumber: 7, redo: k33RerouteEdge16_HideAffectedEdge, undo: _undoK33RerouteEdge16_HideAffectedEdge },
      { description: '8', stepNumber: 8, redo: k33RerouteEdge16_RedrawAffectedEdge, undo: _undoK33RerouteEdge16_RedrawAffectedEdge },
    ];

    this.EmbeddingInstance = new EmbeddingInstance(context, k33Vertices, k33Edges, K33_EDGE_SEGMENTS, steps, 7, 1, 3);
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
