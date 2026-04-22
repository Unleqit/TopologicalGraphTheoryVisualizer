import { DoubleSide, Mesh, MeshStandardMaterial, Scene, Vector3 } from 'three';
import { _3DGraphVertex } from '../../graph/types/graph-3d-vertex';
import { GraphEdge } from '../../graph/types/graph-edge';
import { VisualizationStep } from './visualization/types/visualization-step';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { UpdateUIFunction } from './visualization/types/update-ui-function';
import { clamp } from 'three/src/math/MathUtils.js';
import { redrawEdgeRecords } from './visualization/helpers/edge-records/redraw-edge-records';
import { redrawVertexRecords } from './visualization/helpers/vertex-records/redraw-vertex-records';
import { ensureNotVisibleBeforeRedo } from './visualization/helpers/visibility/ensure-not-visible-before-redo';
import { ensureVisibleBeforeUndo } from './visualization/helpers/visibility/ensure-visible-before-undo';
import { SurfaceSceneBaseUIDisplayResult } from './visualization/types/visualization-context-ui-display-result';
import { SceneBase } from '../scene-base';
import { EdgeRecord } from './visualization/types/edge-record';
import { VertexRecord } from './visualization/types/vertex-record';
import { createVertexRecords } from './visualization/helpers/vertex-records/create-vertex-records';
import { createEdgeRecordsFromGraphEdges } from './visualization/helpers/edge-records/create-edge-records';

export abstract class SurfaceSceneBase extends SceneBase {
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
  private test: boolean = false;
  private prev: number = -1;
  private steps;
  private reorderingAnimationDuration: number;
  private pauseDuration: number;
  private morphingAnimationDuration: number;

  constructor(
    canvasElement: HTMLCanvasElement,
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
    super(canvasElement);
    this.steps = steps.sort((a, b) => a.stepNumber - b.stepNumber);
    this.reorderingAnimationDuration = Math.max(reorderingAnimationDuration, 1);
    this.pauseDuration = pauseDuration;
    this.morphingAnimationDuration = Math.max(morphingAnimationDuration, 1);
    this.vertices = new Map(createVertexRecords(vertices).map((record) => [record.id, record]));
    this.edges = new Map(createEdgeRecordsFromGraphEdges(this.vertices, edges, edgeSegmentCount).map((record) => [record.id, record]));
    this.edgeSegmentCount = edgeSegmentCount;
    this.once = Array.from({ length: steps.length }, () => false);
    this.meshXScale = initialXScale;
    this.meshYScale = initialYSCale;

    this.coordinateTransformFunction = this.patchCoordinateTransformationFunction(coordinateTransformFunction);
    this.morphFunction = this.patchMorphFunction(morphFunction);
    this.updateUIFunction = updateUIFunction;

    const geo = new ParametricGeometry(this.morphFunction, 80, 60);
    this.mesh = new Mesh(geo, new MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: DoubleSide }));

    this.scene.add(this.mesh);
  }

  public override setVisible(visible: boolean): void {
    super.setVisible(visible);
    this.mesh.visible = visible;
    this.vertices.forEach((vertex) => (vertex.visible = visible));
    this.edges.forEach((edge) => (edge.visible = visible));
  }

  public override update(time: number): void {
    if (this.startTime < 0) {
      this.startTime = time;
    }

    const normed = (time - this.startTime) / this.reorderingAnimationDuration;
    const normed2 = (time - (this.startTime + this.reorderingAnimationDuration + this.pauseDuration)) / this.morphingAnimationDuration;

    if (normed <= 1) {
      this.updateGraphEmbedding(normed);
    } else if (normed2 >= 0 && normed2 <= 1) {
      this.updateShape(normed2);
    }
  }

  public updateGraphEmbedding(normedProgress: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    if (this.prev === normedProgress) {
      return;
    }

    const totalStepCount = this.steps.length;
    const newStepIndex = clamp(Number.parseInt((normedProgress * totalStepCount - 0.5).toFixed(0)), 0, totalStepCount - 1);
    const newStep = this.steps[newStepIndex];
    const displayResult: SurfaceSceneBaseUIDisplayResult = { description: newStep.description, normedStepValue: normedProgress, stepValue: newStep.stepNumber };

    this.updateUIFunction(displayResult, 'reorder');

    for (const step of this.steps) {
      if (this.prev < normedProgress && normedProgress >= step.stepNumber / totalStepCount && ensureNotVisibleBeforeRedo(this, step.stepNumber)) {
        step.redo(this);
      } else if (this.prev >= normedProgress && normedProgress < step.stepNumber / totalStepCount && ensureVisibleBeforeUndo(this, step.stepNumber)) {
        step.undo(this);
      }
    }
    this.prev = normedProgress;
  }

  updateShape(normed: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    this.updateUIFunction({ description: '', normedStepValue: normed, stepValue: -1 }, 'transform');

    this.morph = normed;
    const newTorusGeo = new ParametricGeometry(this.morphFunction, 80, 60);
    this.mesh.geometry.dispose();
    this.mesh.geometry = newTorusGeo;

    redrawVertexRecords(this, this.morphFunction);
    redrawEdgeRecords(this, this.morphFunction, false);
  }

  private patchMorphFunction(fn: (u: number, v: number, p: Vector3, morph: number, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => fn(u, v, p, this.morph, this.meshXScale, this.meshYScale);
  }

  private patchCoordinateTransformationFunction(fn: (u: number, v: number, p: Vector3, xScale: number, yScale: number) => void): (u: number, v: number, p: Vector3) => void {
    return (u: number, v: number, p: Vector3) => fn(u, v, p, this.meshXScale, this.meshYScale);
  }
}
