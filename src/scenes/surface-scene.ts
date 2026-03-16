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

const EDGE_SEGMENTS = 40;
const K33_EDGE_SEGMENTS = 140;

//step 1 constants
const k33Square: _3DGraphVertex[] = [
  { vertex: { id: 1, x: 0.45, y: 0.42 }, position: new THREE.Vector3() }, // a0
  { vertex: { id: 2, x: 0.5, y: 0.42 }, position: new THREE.Vector3() }, // a1
  { vertex: { id: 3, x: 0.55, y: 0.42 }, position: new THREE.Vector3() }, // a2
  { vertex: { id: 4, x: 0.45, y: 0.62 }, position: new THREE.Vector3() }, // b0
  { vertex: { id: 5, x: 0.5, y: 0.62 }, position: new THREE.Vector3() }, // b1
  { vertex: { id: 6, x: 0.55, y: 0.62 }, position: new THREE.Vector3() }, // b2
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
  private k33TorusVertexMeshes: THREE.Mesh[] = [];
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
    this.createK33TorusVertices();
    this.createK33TorusEdges();
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

  private createLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false, // ensures label is not hidden inside geometry
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.25, 0.25, 0.25);

    return sprite;
  }

  private createK33TorusVertices() {
    const geo = new THREE.SphereGeometry(0.06, 16, 16);
    const matA = new THREE.MeshStandardMaterial({ color: 0xff8800 });
    const matB = new THREE.MeshStandardMaterial({ color: 0xaa00ff });

    for (let i = 0; i < k33Square.length; i++) {
      const mat = i < 3 ? matA : matB;

      const m = new THREE.Mesh(geo, mat);
      m.visible = false;

      const label = this.createLabelSprite(k33Square[i].vertex.id.toString());
      label.position.set(0, 0.12, 0);
      m.add(label);

      this.scene.add(m);
      this.k33TorusVertexMeshes.push(m);
    }
  }

  private k33TorusEdgeLines: THREE.Line[] = [];
  private createK33TorusEdges() {
    for (const _ of k33Edges) {
      const pts: THREE.Vector3[] = [];

      for (let i = 0; i <= K33_EDGE_SEGMENTS; i++) {
        pts.push(new THREE.Vector3());
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ff88 }));
      line.visible = false;

      this.scene.add(line);
      this.k33TorusEdgeLines.push(line);
    }
  }

  applyStep(step: number, time: number): void {
    if (step !== this.currentStep) {
      this.currentStep = step;
      this.stepStartTime = time;
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
    this.torusMorph = Math.min(s * 0.4, 1);
    const tmp = Math.min(s * 0.4, 6);

    const newTorusGeo = new ParametricGeometry(this.squareCylinderTorus.bind(this), 80, 60);

    this.squareCylinderTorusMesh.geometry.dispose();
    this.squareCylinderTorusMesh.geometry = newTorusGeo;

    if (tmp > 1) this.k33ShowVerticesAtStart();
    if (tmp > 1.5) this.k33ShowEdgesAtStart();
    if (tmp > 2) this.k33FlipVertex2And5_HideAffectedEdges();
    if (tmp > 2.5) this.k33FlipVertex2And5_FlipVertices();
    if (tmp > 3) this.k33FlipVertex2And5_RedrawAffectedEdges();
    if (tmp > 3.5) this.k33RouteEdge25AroundTorusSmallRadius_HideAffectedEdge();
    if (tmp > 4) this.k33RouteEdge25AroundTorusSmallRadius_RedrawAffectedEdge();
    if (tmp > 4.5) this.k33RouteEdge16AroundTorusLargeRadius_HideAffectedEdge();
    if (tmp > 5) this.k33RouteEdge16AroundTorusLargeRadius_RedrawAffectedEdge();
  }

  k33ShowVerticesAtStart() {
    for (let i = 0; i < k33Square.length; i++) {
      const v = k33Square[i];
      const p = new THREE.Vector3();
      this.squareCylinderTorus(v.vertex.x, v.vertex.y, p);
      const mesh = this.k33TorusVertexMeshes[i];
      mesh.position.copy(p);
      mesh.visible = true;
    }
  }

  k33ShowEdgesAtStart() {
    for (let i = 0; i < k33Edges.length; i++) {
      const [i0, i1] = k33Edges[i];
      const v0 = k33Square[i0].vertex;
      const v1 = k33Square[i1].vertex;

      const line = this.k33TorusEdgeLines[i];
      line.visible = true;
      const pos = line.geometry.attributes.position;

      for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
        const t = j / K33_EDGE_SEGMENTS;

        const u = THREE.MathUtils.lerp(v0.x, v1.x, t);
        const v = THREE.MathUtils.lerp(v0.y, v1.y, t);

        const p = new THREE.Vector3();
        this.squareCylinderTorus(u, v, p);

        pos.setXYZ(j, p.x, p.y, p.z);
      }

      pos.needsUpdate = true;
    }
  }

  k33FlipVertex2And5_HideAffectedEdges() {
    //24 25 26 15 35
    const affectedLineMeshes = [this.k33TorusEdgeLines[1], this.k33TorusEdgeLines[3], this.k33TorusEdgeLines[4], this.k33TorusEdgeLines[5], this.k33TorusEdgeLines[7]];
    for (let i = 0; i < affectedLineMeshes.length; i++) {
      affectedLineMeshes[i].visible = false;
    }
  }

  k33FlipVertex2And5_FlipVertices() {
    const mesh2 = this.k33TorusVertexMeshes[1];
    const mesh5 = this.k33TorusVertexMeshes[4];
    const tmp = new THREE.Vector3();
    tmp.copy(mesh2.position);
    mesh2.position.copy(mesh5.position);
    mesh5.position.copy(tmp);
    mesh2.geometry.attributes.position.needsUpdate = true;
    mesh5.geometry.attributes.position.needsUpdate = true;
  }

  k33FlipVertex2And5_RedrawAffectedEdges() {
    //24 25 26 15 35
    const affectedLineMeshes = [this.k33TorusEdgeLines[1], this.k33TorusEdgeLines[3], this.k33TorusEdgeLines[4], this.k33TorusEdgeLines[5], this.k33TorusEdgeLines[7]];
    //54 52 56 12 32
    const updatedLines = [
      [4, 3],
      [4, 1],
      [4, 5],
      [0, 1],
      [2, 1],
    ];

    //replace cached lines
    for (const mesh of affectedLineMeshes) {
      const points = [];

      for (let i = 0; i <= K33_EDGE_SEGMENTS; i++) {
        points.push(new THREE.Vector3());
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
      this.scene.add(line);
      this.edgeLines[this.edgeLines.indexOf(line)!] = line;
    }

    for (let i = 0; i < updatedLines.length; i++) {
      const [i0, i1] = updatedLines[i];
      const v0 = k33Square[i0].vertex;
      const v1 = k33Square[i1].vertex;

      const line = affectedLineMeshes[i];
      line.visible = true;
      const pos = line.geometry.attributes.position;

      for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
        const t = j / K33_EDGE_SEGMENTS;

        const u = THREE.MathUtils.lerp(v0.x, v1.x, t);
        const v = THREE.MathUtils.lerp(v0.y, v1.y, t);

        const p = new THREE.Vector3();
        this.squareCylinderTorus(u, v, p);

        pos.setXYZ(j, p.x, p.y, p.z);
      }

      pos.needsUpdate = true;
    }
  }

  k33RouteEdge25AroundTorusSmallRadius_HideAffectedEdge() {
    this.k33TorusEdgeLines[3].visible = false;
  }

  k33RouteEdge25AroundTorusSmallRadius_RedrawAffectedEdge() {
    //25
    const affectedLineMeshes = [this.k33TorusEdgeLines[3]];
    //52
    const updatedLines = [[4, 1]];

    //replace cached lines
    for (const mesh of affectedLineMeshes) {
      const points = [];

      for (let i = 0; i <= K33_EDGE_SEGMENTS; i++) {
        points.push(new THREE.Vector3());
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
      this.scene.add(line);
      this.edgeLines[this.edgeLines.indexOf(line)!] = line;
    }

    for (let i = 0; i < updatedLines.length; i++) {
      const [i0, i1] = updatedLines[i];
      const v0 = k33Square[i0].vertex;
      const v1 = k33Square[i1].vertex;

      const line = affectedLineMeshes[i];
      line.visible = true;
      const pos = line.geometry.attributes.position;

      for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
        const t = j / K33_EDGE_SEGMENTS;

        const u = THREE.MathUtils.lerp(v0.x, v1.x, t);
        const v = this.lerpWrap01Long(v0.y, v1.y, t);

        const p = new THREE.Vector3();
        this.squareCylinderTorus(u, v, p);

        pos.setXYZ(j, p.x, p.y, p.z);
      }

      pos.needsUpdate = true;
    }
  }

  k33RouteEdge16AroundTorusLargeRadius_HideAffectedEdge() {
    this.k33TorusEdgeLines[2].visible = false;
  }

  k33RouteEdge16AroundTorusLargeRadius_RedrawAffectedEdge() {
    const affectedLineMeshes = [this.k33TorusEdgeLines[2]];
    const updatedLines = [[0, 5]];

    //replace cached lines
    for (const mesh of affectedLineMeshes) {
      const points = [];

      for (let i = 0; i <= K33_EDGE_SEGMENTS; i++) {
        points.push(new THREE.Vector3());
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x00ffff }));
      this.scene.add(line);
      this.edgeLines[this.edgeLines.indexOf(line)!] = line;
    }

    for (let i = 0; i < updatedLines.length; i++) {
      const [i0, i1] = updatedLines[i];
      const v0 = k33Square[i0].vertex;
      const v1 = k33Square[i1].vertex;

      const line = affectedLineMeshes[i];
      line.visible = true;
      const pos = line.geometry.attributes.position;

      for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
        const t = j / K33_EDGE_SEGMENTS;

        const u = this.lerpWrap01Long(v0.x, v1.x, t);
        const v = THREE.MathUtils.lerp(v0.y, v1.y, t);

        const p = new THREE.Vector3();
        this.squareCylinderTorus(u, v, p);

        pos.setXYZ(j, p.x, p.y, p.z);
      }

      pos.needsUpdate = true;
    }
  }

  lerpWrap01Long(a: number, b: number, t: number): number {
    let delta = b - a;
    if (Math.abs(delta) < 0.5) {
      delta = delta > 0 ? delta - 1 : delta + 1;
    }
    let u = a + delta * t;
    if (u < 0) u += 1;
    if (u > 1) u -= 1;
    return u;
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
    const angle = (v - 0.15) * bend;
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
