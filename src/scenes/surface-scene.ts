import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { _3DGraphVertex } from '../graph/graph-3d-vertex';
import { GraphEdge } from '../graph/graph-edge';

//step 0 constants
const vertices: _3DGraphVertex[] = [
  { vertex: { id: 0, x: 0.2, y: 0.3 }, position: new THREE.Vector3() },
  { vertex: { id: 1, x: 0.8, y: 0.4 }, position: new THREE.Vector3() },
  { vertex: { id: 2, x: 0.5, y: 0.8 }, position: new THREE.Vector3() },
];

const edges: GraphEdge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
];

const EDGE_SEGMENTS = 60;

//step 1 constants
const k33Square: _3DGraphVertex[] = [
  { vertex: { id: 0, x: 0.2, y: 0.8 }, position: new THREE.Vector3() }, // a0
  { vertex: { id: 1, x: 0.5, y: 0.8 }, position: new THREE.Vector3() }, // a1
  { vertex: { id: 2, x: 0.8, y: 0.8 }, position: new THREE.Vector3() }, // a2
  { vertex: { id: 3, x: 0.2, y: 0.2 }, position: new THREE.Vector3() }, // b0
  { vertex: { id: 4, x: 0.5, y: 0.2 }, position: new THREE.Vector3() }, // b1
  { vertex: { id: 5, x: 0.8, y: 0.2 }, position: new THREE.Vector3() }, // b2
];

const k33Edges: GraphEdge[] = [
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 3],
  [1, 4],
  [1, 5],
  [2, 3],
  [2, 4],
  [2, 5],
];

//TBD

//step 2 constants
//TBD

export class SurfaceScene {
  readonly scene = new THREE.Scene();

  private squareCylinderSphereMesh: THREE.Mesh;
  private squareCylinderTorusMesh: THREE.Mesh;
  private möbiusMesh: THREE.Mesh;

  //step 0
  private vertexMeshes: THREE.Mesh[] = [];
  private edgeLines: THREE.Line[] = [];

  //step 1
  private k5VertexMeshes: THREE.Mesh[] = [];
  private k5EdgeLines: THREE.Line[] = [];

  //step 2
  //TBD

  private objects: THREE.Object3D[] = [];

  private morph = 0;
  private torusMorph = 0;
  private möbiusMorph = 0;
  private stepStartTime = 0;
  private currentStep = 0;

  constructor() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: THREE.DoubleSide });
    const geo = new ParametricGeometry(this.squareCylinderSphere.bind(this), 140, 80);
    const torusGeo = new ParametricGeometry(this.squareCylinderTorus.bind(this), 80, 60);
    const mobiusGeo = new ParametricGeometry(this.squareMöbius.bind(this), 100, 30);

    this.squareCylinderSphereMesh = new THREE.Mesh(geo, mat);
    this.squareCylinderTorusMesh = new THREE.Mesh(torusGeo, mat);
    this.möbiusMesh = new THREE.Mesh(mobiusGeo, mat);

    this.squareCylinderTorusMesh.visible = false;
    this.möbiusMesh.visible = false;

    //step 0
    this.createVertexMeshes();
    this.createEdgeLines();

    //step 1
    this.createK5Meshes();

    //step 2
    //TBD

    this.add(this.squareCylinderSphereMesh);
    this.add(this.squareCylinderTorusMesh);
    this.add(this.möbiusMesh);
  }

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  createVertexMeshes() {
    const vGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const vMat = new THREE.MeshStandardMaterial({ color: 0xffaa00 });

    for (const v of vertices) {
      const m = new THREE.Mesh(vGeo, vMat);
      this.scene.add(m);
      this.vertexMeshes.push(m);
    }
  }

  createEdgeLines() {
    for (const e of edges) {
      const points = [];

      for (let i = 0; i <= EDGE_SEGMENTS; i++) {
        points.push(new THREE.Vector3());
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);

      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff }));

      this.scene.add(line);
      this.edgeLines.push(line);
    }
  }

  private createK5Meshes() {
    const vGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const vMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });

    for (let i = 0; i < k33Square.length; i++) {
      const m = new THREE.Mesh(vGeo, vMat);
      this.scene.add(m);
      this.k5VertexMeshes.push(m);
    }

    for (const e of k33Edges) {
      const pts: THREE.Vector3[] = [];

      for (let i = 0; i <= EDGE_SEGMENTS; i++) {
        pts.push(new THREE.Vector3());
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff6666 }));

      this.scene.add(line);
      this.k5EdgeLines.push(line);
    }
  }

  applyStep(step: number, time: number): void {
    if (step !== this.currentStep) {
      this.currentStep = step;
      this.stepStartTime = time; // restart animation
    }

    this.squareCylinderSphereMesh.visible = step === 0;
    this.vertexMeshes.forEach((mesh) => (mesh.visible = step === 0));
    this.edgeLines.forEach((edge) => (edge.visible = step === 0));

    this.squareCylinderTorusMesh.visible = step === 1;
    this.möbiusMesh.visible = step === 2;
  }

  update(time: number): void {
    const s = (time - this.stepStartTime) * 0.001;

    switch (this.currentStep) {
      case 0:
        this.updateSquareCylinderSphere(s);
        break;
      case 1:
        this.updateSquareCylinderTorus(s);
        break;
      case 2:
        this.updateSquareMöbius(s);
        break;
    }
  }

  updateSquareCylinderSphere(s: number) {
    //update morphed object geometry
    this.morph = (Math.sin(s * 0.4 - Math.PI / 2) + 1) * 0.5;
    const newGeo = new ParametricGeometry(this.squareCylinderSphere.bind(this), 140, 80);
    this.squareCylinderSphereMesh.geometry.dispose();
    this.squareCylinderSphereMesh.geometry = newGeo;

    //update vertices of embedded graph
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const pos = new THREE.Vector3();
      this.squareCylinderSphere(v.vertex.x, v.vertex.y, pos);
      this.vertexMeshes[i].position.copy(pos);
    }

    //update edges of embedded graph
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const v0 = vertices[e[0]];
      const v1 = vertices[e[1]];

      const line = this.edgeLines[i];
      const pos = (line.geometry as THREE.BufferGeometry).attributes.position;

      for (let j = 0; j <= EDGE_SEGMENTS; j++) {
        const t = j / EDGE_SEGMENTS;

        const u = THREE.MathUtils.lerp(v0.vertex.x, v1.vertex.x, t);
        const v = THREE.MathUtils.lerp(v0.vertex.y, v1.vertex.y, t);

        const p = new THREE.Vector3();
        this.squareCylinderSphere(u, v, p);

        pos.setXYZ(j, p.x, p.y, p.z);
      }

      pos.needsUpdate = true;
    }
  }

  updateSquareCylinderTorus(s: number) {
    this.torusMorph = (Math.sin(s * 0.4 - Math.PI / 2) + 1) * 0.5;

    // update morphed surface geometry
    const newTorusGeo = new ParametricGeometry(this.squareCylinderTorus.bind(this), 80, 60);
    this.squareCylinderTorusMesh.geometry.dispose();
    this.squareCylinderTorusMesh.geometry = newTorusGeo;
  }

  updateSquareMöbius(s: number) {
    this.möbiusMorph = (Math.sin(s * 0.4 - Math.PI / 2) + 1) * 0.5;

    const newMöbiusGeo = new ParametricGeometry(this.squareMöbius.bind(this), 80, 60);
    this.möbiusMesh.geometry.dispose();
    this.möbiusMesh.geometry = newMöbiusGeo;
  }

  squareCylinderSphere(u: number, v: number, target: THREE.Vector3) {
    const t = this.morph;

    // ----- square ------
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    const square = new THREE.Vector3(x * 1.5, y * 1.5, 0);

    // ----- cylinder -----
    const bend = Math.PI * 2 * Math.min(t * 2, 1);
    const radius = 1;
    const angle = (u - 0.5) * bend;
    const cylinder = new THREE.Vector3(Math.sin(angle) * radius, y * 1.5, (1 - Math.cos(angle)) * radius - radius);

    // ----- sphere -----
    const R = 1.4;
    const theta = u * 2 * Math.PI;
    const phi = (v - 0.5) * Math.PI;
    const sphere = new THREE.Vector3(Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta)).multiplyScalar(R);

    //different animations
    if (t < 0.5) {
      const k = t * 2;
      target.lerpVectors(square, cylinder, k);
    } else {
      const k = (t - 0.5) * 2;
      target.lerpVectors(cylinder, sphere, k);
    }
  }

  squareCylinderTorus(u: number, v: number, target: THREE.Vector3) {
    const t = this.torusMorph;

    // ----- square ------
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    const square = new THREE.Vector3(x * 1.5, y * 1.5, 0);

    // ----- cylinder -----
    const bend = Math.PI * 2 * Math.min(t * 2, 1);
    const radius = 1;
    const angle = (v - 0.5) * bend;
    const cylinder = new THREE.Vector3(x * 1.5, Math.sin(angle) * radius, (1 - Math.cos(angle)) * radius - radius);

    // ------ torus --------
    const L = 3.0;
    const baseRadius = 1.2;
    const tubeScale = 0.7;
    const bendFactor = Math.max(t * 2 - 1, 0);
    const torusBend = bendFactor * Math.PI * 2;
    const bendRadius = L / Math.max(torusBend, 1e-5);
    const majorRadius = bendRadius + baseRadius;
    const a = (x * 1.5) / bendRadius;
    const scaledTube = cylinder.z * tubeScale * bendFactor;
    const radius2 = bendFactor * majorRadius + (1 - bendFactor) * 0;
    const torus = new THREE.Vector3((1 - bendFactor) * x + Math.sin(a) * (radius2 + scaledTube), cylinder.y, (1 - bendFactor) * cylinder.z + Math.cos(a) * (radius2 + scaledTube));

    //different animations
    if (t < 0.5) {
      const k = t * 2;
      target.lerpVectors(square, cylinder, k);
    } else {
      const k = (t - 0.5) * 2;
      target.lerpVectors(cylinder, torus, k);
    }
  }

  squareMöbius(u: number, v: number, target: THREE.Vector3) {
    const t = this.möbiusMorph;

    const scale = 1.4;
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    const s = t * t * (3 - 2 * t);
    const angle = x * Math.PI * s;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const R = 1.3;
    const width = y * (1.5 * (1 - s) + 0.35 * s);
    const twist = angle * 0.5 * s;
    const cosT = Math.cos(twist);
    const sinT = Math.sin(twist);
    const r = R + width * cosT;
    const X = r * cosA;
    const Y = r * sinA;
    const Z = width * sinT;
    const sqX = x * 1.5;
    const sqY = y * 1.5;

    target.set((sqX * (1 - s) + X * s) * scale, (sqY * (1 - s) + Y * s) * scale, Z * s * scale);
  }
}
