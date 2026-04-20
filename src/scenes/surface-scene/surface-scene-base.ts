import { Scene, Vector3 } from 'three';
import { _3DGraphVertex } from '../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../graph/types/graph-edge';
import { VisualizationStep } from './visualization/types/visualization-step';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { VisualizationContext } from './visualization/visualization-context';
import { ISurfaceScene } from './isurface-scene';
import { UpdateUIFunction } from './visualization/types/update-ui-function';
import { clamp } from 'three/src/math/MathUtils.js';
import { redrawEdgeRecords } from './visualization/helpers/edge-records/redraw-edge-records';
import { redrawVertexRecords } from './visualization/helpers/vertex-records/redraw-vertex-records';
import { ensureNotVisibleBeforeRedo } from './visualization/helpers/visibility/ensure-not-visible-before-redo';
import { ensureVisibleBeforeUndo } from './visualization/helpers/visibility/ensure-visible-before-undo';
import { VisualizationContextUIDisplayResult } from './visualization/types/visualization-context-ui-display-result';

export abstract class SurfaceSceneBase implements ISurfaceScene {
  public context: VisualizationContext;
  private test: boolean = false;
  private prev: number = -1;
  private graphEmbeddingReorderingSteps;
  private reorderingAnimationDuration: number;
  private pauseDuration: number;
  private morphingAnimationDuration: number;
  private startTime: number = -1;

  constructor(
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
    this.context = new VisualizationContext(vertices, edges, edgeSegmentCount, coordinateTransformFunction, morphFunction, updateUIFunction, initialXScale, initialYSCale);
    this.graphEmbeddingReorderingSteps = steps.sort((a, b) => a.stepNumber - b.stepNumber);
    this.reorderingAnimationDuration = Math.max(reorderingAnimationDuration, 1);
    this.pauseDuration = pauseDuration;
    this.morphingAnimationDuration = Math.max(morphingAnimationDuration, 1);
  }

  public setVisible(visible: boolean): void {
    this.context.mesh.visible = visible;
    this.context.vertices.forEach((vertex) => (vertex.visible = visible));
    this.context.edges.forEach((edge) => (edge.visible = visible));
  }

  public autoUpdate(time: number): void {
    if (this.startTime < 0) {
      this.startTime = time;
      return;
    }

    const tmp = (time - this.startTime) * 0.001;
    const divisor = this.reorderingAnimationDuration;
    const tmp2 = (time - (this.startTime + (1 / 0.001) * divisor + (1 / 0.001) * this.pauseDuration)) * 0.001;
    const divisor2 = this.morphingAnimationDuration;
    const normed = tmp / divisor;
    const normed2 = tmp2 / divisor2;

    if (normed <= 1) {
      this.updateGraphEmbedding(normed);
    } else if (normed2 >= 0 && normed2 <= 1) {
      this.updateShape(normed2);
    }
  }

  public updateGraphEmbedding(normed: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    if (this.prev === normed) {
      return;
    }

    const totalStepCount = this.graphEmbeddingReorderingSteps.length;
    const newStepIndex = clamp(Number.parseInt((normed * totalStepCount - 0.5).toFixed(0)), 0, totalStepCount - 1);
    const newStep = this.graphEmbeddingReorderingSteps[newStepIndex];
    const displayResult: VisualizationContextUIDisplayResult = { description: newStep.description, normedStepValue: normed, stepValue: newStep.stepNumber };

    this.context.updateUIFunction(displayResult, 'reorder');

    if (this.prev < normed) {
      for (const step of this.graphEmbeddingReorderingSteps) {
        if (normed >= step.stepNumber / totalStepCount && ensureNotVisibleBeforeRedo(this.context, step.stepNumber)) {
          step.redo(this.context);
        }
      }
    } else {
      for (const step of this.graphEmbeddingReorderingSteps) {
        if (normed < step.stepNumber / totalStepCount && ensureVisibleBeforeUndo(this.context, step.stepNumber)) {
          step.undo(this.context);
        }
      }
    }
    this.prev = normed;
  }

  updateShape(normed: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    this.context.updateShape(normed);
  }

  public getScene(): Scene {
    return this.context.scene;
  }
}
