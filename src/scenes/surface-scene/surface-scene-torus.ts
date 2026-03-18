import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { _3DGraphVertex } from '../../graph/graph-3d-vertex';
import { GraphEdge } from '../../graph/graph-edge';
import { createEdgeLine, createLabeledVertexMesh, createVertexMesh } from '../utils';

const K33_EDGE_SEGMENTS = 140;

const k33Square: _3DGraphVertex[] = [
  { vertex: { id: 1, x: 0.25, y: 0.3 }, position: new THREE.Vector3() }, // a0
  { vertex: { id: 2, x: 0.5, y: 0.3 }, position: new THREE.Vector3() }, // a1
  { vertex: { id: 3, x: 0.75, y: 0.3 }, position: new THREE.Vector3() }, // a2
  { vertex: { id: 4, x: 0.25, y: 0.7 }, position: new THREE.Vector3() }, // b0
  { vertex: { id: 5, x: 0.5, y: 0.7 }, position: new THREE.Vector3() }, // b1
  { vertex: { id: 6, x: 0.75, y: 0.7 }, position: new THREE.Vector3() }, // b2
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

type VertexRecord = {
  id: number; // vertex ID
  data: _3DGraphVertex; // original graph vertex
  mesh: THREE.Mesh; // visual
  isShadow: boolean;
  visible: boolean;
};

type EdgeRecord = {
  id: string; // edge ID
  v0: VertexRecord; // direct reference
  v1: VertexRecord; // direct reference
  line: THREE.Line;
  isShadow: boolean;
  visible: boolean;
};

export class SurfaceSceneTorus {
  private scene: THREE.Scene;
  private objects: THREE.Object3D[] = [];
  private squareCylinderTorusMesh: THREE.Mesh;
  private morph = 0;
  private meshXScale = 1.5;
  private meshYScale = 1.5;
  private vertices: Map<number, VertexRecord> = new Map();
  private edges: Map<string, EdgeRecord> = new Map();
  private once: boolean[] = Array.from({ length: 10 }, () => false);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: THREE.DoubleSide });
    const torusGeo = new ParametricGeometry(this.squareCylinderTorus.bind(this), 80, 60);

    this.squareCylinderTorusMesh = new THREE.Mesh(torusGeo, mat);
    this.setVisible(true);
    //step 1
    this.createK33TorusVertices();
    this.createK33TorusEdges();
    this.add(this.squareCylinderTorusMesh);

    this.k33ShowVerticesAtStart();
    this.k33ShowEdgesAtStart();
  }

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  setVisible(visible: boolean): void {
    this.squareCylinderTorusMesh.visible = visible;
    this.vertices.forEach((vertex) => this.setVertexVisible(vertex, visible));
    this.edges.forEach((edge) => this.setEdgeVisible(edge, visible));
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

  private createK33TorusVertices(): void {
    const matA = new THREE.MeshBasicMaterial({ color: 0xff8800, depthTest: false });
    const matB = new THREE.MeshBasicMaterial({ color: 0xaa00ff, depthTest: false });

    for (let i = 0; i < k33Square.length; i++) {
      const gv = k33Square[i];
      const mat = i < 3 ? matA : matB;
      const mesh = createLabeledVertexMesh(mat, gv, true);
      const record: VertexRecord = { id: gv.vertex.id, data: gv, mesh, isShadow: false, visible: true };
      this.vertices.set(record.id, record);
      this.scene.add(mesh);
    }
  }

  private createK33TorusEdges(): void {
    for (const [i0, i1] of k33Edges) {
      const gv0 = k33Square[i0];
      const gv1 = k33Square[i1];
      const v0 = this.vertices.get(gv0.vertex.id)!;
      const v1 = this.vertices.get(gv1.vertex.id)!;
      const line = createEdgeLine([i0, i1], K33_EDGE_SEGMENTS, true);
      const min = v0.id < v1.id ? v0.id : v1.id;
      const max = v0.id > v1.id ? v0.id : v1.id;
      const record: EdgeRecord = { id: `${min},${max}`, v0, v1, line, isShadow: false, visible: true };
      this.edges.set(record.id, record);
      this.scene.add(line);
    }
  }

  square(u: number, v: number, target: THREE.Vector3): void {
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    const square = new THREE.Vector3(x * this.meshXScale, y * this.meshYScale, 0);
    target.copy(square);
  }

  squareCylinderTorus(u: number, v: number, target: THREE.Vector3): void {
    const t = this.morph;

    // ----- square ------
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    const square = new THREE.Vector3(x * this.meshXScale, y * this.meshYScale, 0);

    // ----- cylinder -----
    const bend = Math.PI * 2 * Math.min(t * 2, 1);
    const radius = 1;
    const angle = (v - 0.15) * bend;
    const cylinder = new THREE.Vector3(x * this.meshXScale, Math.sin(angle) * radius, (1 - Math.cos(angle)) * radius - radius);

    // ------ torus --------
    const L = 3.0;
    const baseRadius = 1.2;
    const tubeScale = 0.7;
    const bendFactor = Math.max(t * 2 - 1, 0);
    const torusBend = bendFactor * Math.PI * 2;
    const bendRadius = L / Math.max(torusBend, 1e-5);
    const majorRadius = bendRadius + baseRadius;
    const a = (x * this.meshXScale) / bendRadius;
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

  private test: boolean = false;
  updateSquareCylinderTorusGraphEmbedding(s: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    const tmp = automatic ? Math.min(s * 0.4, 7) + 1 : s + 1;

    if (tmp > 2) {
      this.k33FlipVertex2And5_HideAffectedEdges();
    }
    if (tmp > 2.5) {
      this.k33FlipVertex2And5_FlipVertices();
    }
    if (tmp > 3) {
      this.k33FlipVertex2And5_RedrawAffectedEdges();
    }
    if (tmp > 3.5) {
      this.k33RouteEdge25AroundTorusSmallRadius_HideAffectedEdge();
    }
    if (tmp > 4) {
      this.k33RouteEdge25AroundTorusSmallRadius_RedrawAffectedEdge();
    }
    if (tmp > 4.5) {
      this.k33RouteEdge16AroundTorusLargeRadius_HideAffectedEdge();
    }
    if (tmp > 5) {
      this.k33RouteEdge16AroundTorusLargeRadius_RedrawAffectedEdge();
    }
  }

  updateSquareCylinderTorus(s: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    const tmp = automatic ? Math.min(s * 0.4, 7) - 5 : s;
    this.morph = tmp;

    if (tmp >= 0 && tmp <= 1) {
      this.k33MorphSquareToCylinderToTorus();
    }
  }

  k33ShowVerticesAtStart(): void {
    if (this.once[0]) {
      return;
    }
    this.once[0] = true;
    this.redrawVertices(this.vertices.values(), this.square, true, true);
  }

  k33ShowEdgesAtStart(): void {
    if (this.once[1]) {
      return;
    }
    this.once[1] = true;
    this.redrawEdges(this.edges.values(), K33_EDGE_SEGMENTS, this.square, true, true);
  }

  k33FlipVertex2And5_HideAffectedEdges(): void {
    if (this.once[2]) {
      return;
    }
    this.once[2] = true;

    ['2,4', '2,5', '2,6', '1,5', '3,5'].forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        this.scene.remove(edge.line);
        this.edges.delete(edgeId);
      }
    });
  }

  k33FlipVertex2And5_FlipVertices(): void {
    if (this.once[3]) {
      return;
    }
    this.once[3] = true;
    const v2 = this.vertices.get(2);
    const v5 = this.vertices.get(5);

    if (!v2 || !v5) {
      return;
    }

    const tmp = v2.mesh.position.clone();
    v2.mesh.position.copy(v5.mesh.position);
    v5.mesh.position.copy(tmp);
    v2.mesh.geometry.attributes.position.needsUpdate = true;
    v5.mesh.geometry.attributes.position.needsUpdate = true;

    const tmpData = v2.data;
    v2.data = v5.data;
    v5.data = tmpData;
  }

  k33FlipVertex2And5_RedrawAffectedEdges(): void {
    if (this.once[4]) {
      return;
    }
    this.once[4] = true;

    for (const id of ['2,4', '2,5', '2,6', '1,5', '3,5']) {
      const aaa = id.split(',');
      const i0 = Number.parseInt(aaa[0]);
      const i1 = Number.parseInt(aaa[1]);
      const v0 = this.vertices.get(i0);
      const v1 = this.vertices.get(i1);
      if (v0 && v1) {
        const line = createEdgeLine([i0, i1], K33_EDGE_SEGMENTS, true);
        const record: EdgeRecord = { id, v0, v1, line, isShadow: false, visible: true };
        this.edges.set(record.id, record);
        this.scene.add(line);
      }
    }

    this.redrawEdges(this.edges.values(), K33_EDGE_SEGMENTS, this.square, true, true);
  }

  k33RouteEdge25AroundTorusSmallRadius_HideAffectedEdge(): void {
    if (this.once[5]) {
      return;
    }
    this.once[5] = true;

    const edge = this.edges.get('2,5');
    if (edge) {
      this.removeEdge(edge);
    }
  }

  k33RouteEdge25AroundTorusSmallRadius_RedrawAffectedEdge(): void {
    if (this.once[6]) {
      return;
    }
    this.once[6] = true;

    const shadowVertices: _3DGraphVertex[] = [
      { position: new THREE.Vector3(), vertex: { id: 7, x: 0.5, y: 1 } },
      { position: new THREE.Vector3(), vertex: { id: 8, x: 0.5, y: 0 } },
    ];
    const shadowEdges: GraphEdge[] = [
      [2, 7],
      [5, 8],
    ];
    this.addShadowElements(shadowVertices, shadowEdges, new THREE.MeshBasicMaterial(), K33_EDGE_SEGMENTS, false, true);

    for (const v of this.vertices.values()) {
      const gv = v.data;
      const p = new THREE.Vector3();
      this.square(gv.vertex.x, gv.vertex.y, p);
      v.mesh.position.copy(p);
    }

    for (const e of this.edges.values()) {
      const v0 = e.v0.data.vertex;
      const v1 = e.v1.data.vertex;
      const pos = e.line.geometry.attributes.position;

      for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
        const t = j / K33_EDGE_SEGMENTS;

        const u = THREE.MathUtils.lerp(v0.x, v1.x, t);
        const v = THREE.MathUtils.lerp(v0.y, v1.y, t);

        const p = new THREE.Vector3();
        this.square(u, v, p);

        pos.setXYZ(j, p.x, p.y, p.z);
      }

      pos.needsUpdate = true;
      e.line.visible = true;
      e.visible = true;
    }
  }

  k33RouteEdge16AroundTorusLargeRadius_HideAffectedEdge(): void {
    if (this.once[7]) {
      return;
    }
    this.once[7] = true;

    const edge = this.edges.get('1,6');
    if (edge) {
      this.removeEdge(edge);
    }
  }

  k33RouteEdge16AroundTorusLargeRadius_RedrawAffectedEdge(): void {
    if (this.once[8]) {
      return;
    }
    this.once[8] = true;

    const shadowVertices: _3DGraphVertex[] = [
      { position: new THREE.Vector3(), vertex: { id: 9, x: 0, y: 0.5 } },
      { position: new THREE.Vector3(), vertex: { id: 10, x: 1, y: 0.5 } },
    ];
    const shadowEdges: GraphEdge[] = [
      [1, 9],
      [6, 10],
    ];
    this.addShadowElements(shadowVertices, shadowEdges, new THREE.MeshBasicMaterial(), K33_EDGE_SEGMENTS, false, true);
    this.redrawVertices(this.vertices.values());
    this.redrawEdges(this.edges.values());
  }

  private redrawVertices(
    vertices: Iterable<VertexRecord>,
    morphFunction: (u: number, v: number, p: THREE.Vector3) => void = this.square,
    setVisibility: boolean = false,
    visibility: boolean = true
  ): void {
    for (const v of vertices) {
      const gv = v.data;
      const p = new THREE.Vector3();
      morphFunction.call(this, gv.vertex.x, gv.vertex.y, p);
      v.mesh.position.copy(p);
      if (setVisibility) {
        v.mesh.visible = visibility;
        v.visible = visibility;
      }
    }
  }

  private redrawEdges(
    edges: Iterable<EdgeRecord>,
    edgeSegmentCount: number = K33_EDGE_SEGMENTS,
    morphFunction: (u: number, v: number, p: THREE.Vector3) => void = this.square,
    setVisibility: boolean = false,
    visibility: boolean = true
  ): void {
    for (const e of edges) {
      const v0 = e.v0.data.vertex;
      const v1 = e.v1.data.vertex;
      const pos = e.line.geometry.attributes.position;

      for (let j = 0; j <= edgeSegmentCount; j++) {
        const t = j / edgeSegmentCount;
        const u = THREE.MathUtils.lerp(v0.x, v1.x, t);
        const v = THREE.MathUtils.lerp(v0.y, v1.y, t);
        const p = new THREE.Vector3();
        morphFunction.call(this, u, v, p);
        pos.setXYZ(j, p.x, p.y, p.z);
      }

      pos.needsUpdate = true;
      if (setVisibility) {
        e.line.visible = visibility;
        e.visible = visibility;
      }
    }
  }

  k33MorphSquareToCylinderToTorus(): void {
    const newTorusGeo = new ParametricGeometry(this.squareCylinderTorus.bind(this), 80, 60);
    this.squareCylinderTorusMesh.geometry.dispose();
    this.squareCylinderTorusMesh.geometry = newTorusGeo;

    const joinedVertices = Array.from(this.vertices.values());
    for (let i = 0; i < joinedVertices.length; i++) {
      const v = joinedVertices[i];
      const mesh = joinedVertices[i].mesh;
      const pos = new THREE.Vector3();
      this.squareCylinderTorus(v.data.vertex.x, v.data.vertex.y, pos);

      mesh.position.copy(pos);
      const scaleSquare = 0.15; // scale on square/cylinder
      const scaleTorus = 0.06; // scale on torus
      const scale = THREE.MathUtils.lerp(scaleSquare, scaleTorus, Math.max(0, this.morph - 0.5) * 2); // smoothly interpolate after t>0.5
      mesh.scale.set(scale, scale, scale);

      if (mesh.children.length > 0) {
        const sprite = mesh.children[0] as THREE.Sprite;
        sprite.scale.set(0.25 / scale, 0.25 / scale, 0.25 / scale);
      }

      mesh.geometry.attributes.position.needsUpdate = true;
    }

    // Update K3,3 edges positions along current morph
    const joinedEdges = Array.from(this.edges.values());
    for (let i = 0; i < joinedEdges.length; i++) {
      const [v0, v1] = [joinedEdges[i].v0, joinedEdges[i].v1];

      const line = joinedEdges[i].line;
      const posAttr = line.geometry.attributes.position;

      for (let j = 0; j <= K33_EDGE_SEGMENTS; j++) {
        const tEdge = j / K33_EDGE_SEGMENTS;
        const u = THREE.MathUtils.lerp(v0.data.vertex.x, v1.data.vertex.x, tEdge);
        const vCoord = THREE.MathUtils.lerp(v0.data.vertex.y, v1.data.vertex.y, tEdge);

        const p = new THREE.Vector3();
        this.squareCylinderTorus(u, vCoord, p);
        posAttr.setXYZ(j, p.x, p.y, p.z);
      }

      posAttr.needsUpdate = true;
    }
  }

  private removeEdge(edge: EdgeRecord): void {
    this.scene.remove(edge.line);
    edge.line.geometry.dispose();
    if (Array.isArray(edge.line.material)) {
      edge.line.material.forEach((m) => m.dispose());
    } else {
      edge.line.material.dispose();
    }
    this.edges.delete(edge.id);
  }

  private addShadowElements(
    shadowVertices: _3DGraphVertex[],
    shadowEdges: GraphEdge[],
    mat: THREE.Material = new THREE.MeshBasicMaterial({ visible: false }),
    edgeSegmentCount = 140,
    verticesVisible: boolean = false,
    edgesVisible: boolean = true
  ): void {
    const shadowVertexMeshes = shadowVertices.map((vertex) => createVertexMesh(mat, vertex, verticesVisible));
    const shadowEdgeLines = shadowEdges.map((edge) => createEdgeLine(edge, edgeSegmentCount, edgesVisible));

    for (let i = 0; i < shadowVertices.length; i++) {
      const gv = shadowVertices[i];
      const mesh = shadowVertexMeshes[i];
      const record: VertexRecord = { id: gv.vertex.id, data: gv, mesh, isShadow: true, visible: verticesVisible };
      this.vertices.set(record.id, record);
      this.scene.add(mesh);
    }

    for (let i = 0; i < shadowEdges.length; i++) {
      const line = shadowEdgeLines[i];
      const a = this.vertices.get(shadowEdges[i][0]);
      const b = this.vertices.get(shadowEdges[i][1]);
      if (a && b) {
        const min = a.id < b.id ? a.id : b.id;
        const max = a.id > b.id ? a.id : b.id;
        const record: EdgeRecord = { id: `${min},${max}`, isShadow: true, line: line, v0: a, v1: b, visible: edgesVisible };
        this.edges.set(record.id, record);
        this.scene.add(line);
      }
    }

    //add to scene
    for (const m of shadowVertexMeshes) {
      this.scene.add(m);
    }
    for (const l of shadowEdgeLines) {
      this.scene.add(l);
    }
  }
}
