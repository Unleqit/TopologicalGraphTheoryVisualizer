import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { EdgeRecord } from './types/edge-record';
import { VertexRecord } from './types/vertex-record';
import { VisualizationContext } from './types/visualization-context';
import { VisualizationStep } from './types/visualization-step';
import { createK33TorusEdges } from './k33/k33-create-edges';
import { createK33TorusVertices } from './k33/k33-create-vertices';
import { K33_EDGE_SEGMENTS } from './k33/k33-definition';
import { k33ShowEdgesAtStart } from './k33/step-definitions/redo/redo-k33-show-edges-at-start';
import { k33ShowVerticesAtStart } from './k33/step-definitions/redo/redo-k33-show-vertices-at-start';
import { ensureNotDoneBefore } from './helpers/ensure-not-done-before-redo';
import { ensureDoneBefore } from './helpers/ensure-done-before-undo';

export class EmbeddingInstance {
  public context: VisualizationContext;
  private test: boolean = false;
  private prev: number = -1;
  private graphEmbeddingReorderingSteps;

  constructor(context: VisualizationContext, graphEmbeddingReorderingSteps: VisualizationStep[]) {
    this.context = context;
    this.graphEmbeddingReorderingSteps = graphEmbeddingReorderingSteps.sort((a, b) => a.stepNumber - b.stepNumber);

    this.setVisible(true);

    createK33TorusVertices(this.context);
    createK33TorusEdges(this.context);

    this.add(this.context.mesh);

    k33ShowVerticesAtStart(this.context);
    k33ShowEdgesAtStart(this.context);
  }

  private add(obj: THREE.Object3D): void {
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

  public updateSquareCylinderTorusGraphEmbedding(s: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    const tmp = automatic ? Math.min(s * 0.4, 7) + 1 : s + 1;
    this.context.updateUIFunction(tmp);

    if (this.prev === tmp) {
      return;
    }

    if (this.prev < tmp) {
      for (const step of this.graphEmbeddingReorderingSteps) {
        if (tmp >= step.stepNumber / 2 + 0.5 && ensureNotDoneBefore(this.context, step.stepNumber)) {
          step.redo(this.context);
        }
      }
    } else {
      for (const step of this.graphEmbeddingReorderingSteps) {
        if (tmp < step.stepNumber / 2 + 1 && ensureDoneBefore(this.context, step.stepNumber)) {
          step.undo(this.context);
        }
      }
    }
    this.prev = tmp;
  }

  //--------------------undo--------------------------

  updateShape(s: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    const tmp = automatic ? Math.min(s * 0.4, 7) - 5 : s;
    this.context.morph = tmp;

    if (tmp >= 0 && tmp <= 1) {
      this.k33MorphSquareUsingMorphFunction();
    }
  }

  k33MorphSquareUsingMorphFunction(): void {
    const newTorusGeo = new ParametricGeometry(this.context.morphFunction, 80, 60);
    this.context.mesh.geometry.dispose();
    this.context.mesh.geometry = newTorusGeo;

    const joinedVertices = Array.from(this.context.vertices.values());
    for (let i = 0; i < joinedVertices.length; i++) {
      const v = joinedVertices[i];
      const mesh = joinedVertices[i].mesh;
      const pos = new THREE.Vector3();
      this.context.morphFunction(v.data.vertex.x, v.data.vertex.y, pos);

      mesh.position.copy(pos);
      const scaleSquare = 0.15; // scale on square/cylinder
      const scaleTorus = 0.06; // scale on torus
      const scale = THREE.MathUtils.lerp(scaleSquare, scaleTorus, Math.max(0, this.context.morph - 0.5) * 2); // smoothly interpolate after t>0.5
      mesh.scale.set(scale, scale, scale);

      if (mesh.children.length > 0) {
        const sprite = mesh.children[0] as THREE.Sprite;
        sprite.scale.set(0.25 / scale, 0.25 / scale, 0.25 / scale);
      }

      mesh.geometry.attributes.position.needsUpdate = true;
    }

    // Update K3,3 edges positions along current morph
    const joinedEdges = Array.from(this.context.edges.values());
    for (let i = 0; i < joinedEdges.length; i++) {
      const [v0, v1] = [joinedEdges[i].v0, joinedEdges[i].v1];

      const line = joinedEdges[i].line;
      const posAttr = line.geometry.attributes.position;

      for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
        const tEdge = j / K33_EDGE_SEGMENTS;
        const u = THREE.MathUtils.lerp(v0.data.vertex.x, v1.data.vertex.x, tEdge);
        const vCoord = THREE.MathUtils.lerp(v0.data.vertex.y, v1.data.vertex.y, tEdge);

        const p = new THREE.Vector3();
        this.context.morphFunction(u, vCoord, p);
        posAttr.setXYZ(j, p.x, p.y, p.z);
      }

      posAttr.needsUpdate = true;
    }
  }
}
