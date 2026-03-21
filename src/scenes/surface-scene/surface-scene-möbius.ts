import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { EmbeddingInstance } from './visualization/embedding-instance';
import { square } from './coordinate-transformation-functions/square';
import { VisualizationStep } from './visualization/types/visualization-step';
import { VisualizationContext } from './visualization/types/visualization-context';
import { k33FlipVertex2And5_HideAffectedEdges } from './visualization/k33/step-definitions/redo/redo-k33-flip-vertex-2-and-5-hide-affected-edges';
import { k33FlipVertex2And5_FlipVertices } from './visualization/k33/step-definitions/redo/redo-k33-flip-vertex-2-and-5-flip-vertices';
import { k33FlipVertex2And5_RedrawAffectedEdges } from './visualization/k33/step-definitions/redo/redo-k33-flip-vertex-2-and-5-redraw-affected-edges';
import { k33RerouteEdge16_HideAffectedEdge } from './visualization/k33/step-definitions/redo/redo-k33-reroute-edge-16-hide-affected-edge';
import { k33RerouteEdge16_RedrawAffectedEdge } from './visualization/k33/step-definitions/redo/redo-k33-reroute-edge-16-redraw-affected-edges';
import { _undoK33FlipVertex2And5_HideAffectedEdges } from './visualization/k33/step-definitions/undo/undo-k33-flip-vertex-2-and-5-hide-affected-edges';
import { _undoK33RerouteEdge16_HideAffectedEdge } from './visualization/k33/step-definitions/undo/undo-k33-reroute-edge-16-hide-affected-edge';
import { _undoK33RerouteEdge16_RedrawAffectedEdge } from './visualization/k33/step-definitions/undo/undo-k33-reroute-edge-16-redraw-affected-edges';
import { _undoK33FlipVertex2And5_FlipVertices } from './visualization/k33/step-definitions/undo/undo-k33-flip-vertex-2-and-5-flip-vertices';
import { _undoK33FlipVertex2And5_RedrawAffectedEdges } from './visualization/k33/step-definitions/undo/undo-k33-flip-vertex-2-and-5-redraw-affected-edges';
import { squareMöbius } from './coordinate-transformation-functions/square-möbius';
import { k33RerouteEdge34_HideAffectedEdge } from './visualization/k33/step-definitions/redo/redo-k33-reroute-edge-34-hide-affected-edges';
import { k33RerouteEdge34_RedrawAffectedEdge } from './visualization/k33/step-definitions/redo/redo-k33-reroute-edge-34-redraw-affected-edge';
import { _undoK33RerouteEdge34_HideAffectedEdge } from './visualization/k33/step-definitions/undo/undo-k33-reroute-edge-34-hide-affected-edge';
import { _undoK33RerouteEdge34_RedrawAffectedEdge } from './visualization/k33/step-definitions/undo/undo-k33-reroute-edge-34-redraw-affected-edge';

export class SurfaceSceneMöbius {
  private EmbeddingInstance: EmbeddingInstance;
  private initialXScale: number;
  private initialYScale: number;

  constructor(scene: THREE.Scene, updateUIFunction: (value: number) => void) {
    //acquire context
    this.initialXScale = 1.5;
    this.initialYScale = 1.5;

    const patchedCoordinateTransformationFunction = this.patchCoordinateTransformationFunction(square);
    const patchedMorphFunction = this.patchMorphFunction(squareMöbius);

    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: THREE.DoubleSide });
    const torusGeo = new ParametricGeometry(patchedMorphFunction, 80, 60);
    const mesh = new THREE.Mesh(torusGeo, mat);
    const context = new VisualizationContext(scene, mesh, patchedCoordinateTransformationFunction, patchedMorphFunction, updateUIFunction, this.initialXScale, this.initialYScale);

    const steps: VisualizationStep[] = [
      { description: '2', stepNumber: 2, redo: k33FlipVertex2And5_HideAffectedEdges, undo: _undoK33FlipVertex2And5_HideAffectedEdges },
      { description: '3', stepNumber: 3, redo: k33FlipVertex2And5_FlipVertices, undo: _undoK33FlipVertex2And5_FlipVertices },
      { description: '4', stepNumber: 4, redo: k33FlipVertex2And5_RedrawAffectedEdges, undo: _undoK33FlipVertex2And5_RedrawAffectedEdges },
      { description: '5', stepNumber: 5, redo: k33RerouteEdge34_HideAffectedEdge, undo: _undoK33RerouteEdge34_HideAffectedEdge },
      { description: '6', stepNumber: 6, redo: k33RerouteEdge34_RedrawAffectedEdge, undo: _undoK33RerouteEdge34_RedrawAffectedEdge },
      { description: '7', stepNumber: 7, redo: k33RerouteEdge16_HideAffectedEdge, undo: _undoK33RerouteEdge16_HideAffectedEdge },
      { description: '8', stepNumber: 8, redo: k33RerouteEdge16_RedrawAffectedEdge, undo: _undoK33RerouteEdge16_RedrawAffectedEdge },
    ];

    this.EmbeddingInstance = new EmbeddingInstance(context, steps);
  }

  public setVisible(visible: boolean): void {
    this.EmbeddingInstance.setVisible(visible);
  }

  public updateGraphEmbedding(t: number, automatic: boolean = true): void {
    this.EmbeddingInstance.updateSquareCylinderTorusGraphEmbedding(t, automatic);
  }

  public updateShape(t: number, automatic: boolean = true): void {
    this.EmbeddingInstance.updateShape(t, automatic);
  }

  private patchMorphFunction(
    fn: (u: number, v: number, p: THREE.Vector3, morph: number, xScale: number, yScale: number) => void
  ): (u: number, v: number, p: THREE.Vector3) => void {
    return (u: number, v: number, p: THREE.Vector3) => {
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

  private patchCoordinateTransformationFunction(
    fn: (u: number, v: number, p: THREE.Vector3, xScale: number, yScale: number) => void
  ): (u: number, v: number, p: THREE.Vector3) => void {
    return (u: number, v: number, p: THREE.Vector3) => {
      fn(u, v, p, this.EmbeddingInstance?.context.meshXScale ?? this.initialXScale, this.EmbeddingInstance?.context.meshYScale ?? this.initialYScale);
    };
  }
}
