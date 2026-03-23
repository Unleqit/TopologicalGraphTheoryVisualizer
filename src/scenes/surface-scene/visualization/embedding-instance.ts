import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { EdgeRecord } from './types/edge-record';
import { VertexRecord } from './types/vertex-record';
import { VisualizationContext } from './visualization-context';
import { VisualizationStep } from './types/visualization-step';
import { _3DGraphVertex } from '../../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../../graph/types/graph-edge';
import { createVertexRecords } from './helpers/vertex-records/create-vertex-records';
import { createEdgeRecordsFromGraphEdges } from './helpers/edge-records/create-edge-records';
import { redrawVertexRecords } from './helpers/vertex-records/redraw-vertex-records';
import { redrawEdgeRecords } from './helpers/edge-records/redraw-edge-records';
import { Object3D } from 'three';
import { VisualizationContextUIDisplayResult } from './types/visualization-context-ui-display-result';
import { clamp } from 'three/src/math/MathUtils.js';
import { ensureNotVisibleBeforeRedo } from './helpers/visibility/ensure-not-visible-before-redo';
import { ensureVisibleBeforeUndo } from './helpers/visibility/ensure-visible-before-undo';

export class EmbeddingInstance {
  public context: VisualizationContext;
  private test: boolean = false;
  private prev: number = -1;
  private graphEmbeddingReorderingSteps;
  private reorderingAnimationDuration: number;
  private pauseDuration: number;
  private morphingAnimationDuration: number;

  constructor(
    context: VisualizationContext,
    vertices: _3DGraphVertex[],
    edges: GraphEdge[],
    edgeSegmentCount: number,
    graphEmbeddingReorderingSteps: VisualizationStep[],
    reorderingAnimationDuration: number,
    pauseDuration: number,
    morphingAnimationDuration: number
  ) {
    this.context = context;
    this.context.vertices = new Map(createVertexRecords(vertices).map((record) => [record.id, record]));
    this.context.edges = new Map(createEdgeRecordsFromGraphEdges(this.context.vertices, edges, edgeSegmentCount).map((record) => [record.id, record]));
    this.context.edgeSegmentCount = edgeSegmentCount;
    this.graphEmbeddingReorderingSteps = graphEmbeddingReorderingSteps.sort((a, b) => a.stepNumber - b.stepNumber);
    this.reorderingAnimationDuration = Math.max(reorderingAnimationDuration, 1);
    this.pauseDuration = pauseDuration;
    this.morphingAnimationDuration = Math.max(morphingAnimationDuration, 1);

    this.setVisible(true);
    this.add(this.context.mesh);
  }

  private add(obj: Object3D): void {
    this.context.scene.add(obj);
    this.context.objects.push(obj);
  }

  public setVisible(visible: boolean): void {
    this.context.mesh.visible = visible;
    this.context.vertices.forEach((vertex) => this.setVertexVisible(vertex, visible));
    this.context.edges.forEach((edge) => this.setEdgeVisible(edge, visible));
  }

  private setVertexVisible(v: VertexRecord, visible: boolean): void {
    if (!v) {
      return;
    }
    v.visible = visible;
    v.mesh.visible = visible;
  }

  private setEdgeVisible(e: EdgeRecord, visible: boolean): void {
    if (!e) {
      return;
    }
    e.visible = visible;
    e.line.visible = visible;
  }

  private startTime: number = -1;
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

    const displayResult: VisualizationContextUIDisplayResult = { description: '', normedStepValue: normed, stepValue: -1 };
    this.context.updateUIFunction(displayResult, 'transform');

    this.context.morph = normed;
    this.k33MorphSquareUsingMorphFunction();
  }

  k33MorphSquareUsingMorphFunction(): void {
    const newTorusGeo = new ParametricGeometry(this.context.morphFunction, 80, 60);
    this.context.mesh.geometry.dispose();
    this.context.mesh.geometry = newTorusGeo;

    redrawVertexRecords(this.context, this.context.morphFunction);
    redrawEdgeRecords(this.context, this.context.morphFunction, false);
  }
}
