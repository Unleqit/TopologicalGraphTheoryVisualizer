import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { _3DGraphVertex } from '../../graph/graph-3d-vertex';
import { GraphEdge } from '../../graph/graph-edge';
import { createLabeledVertexMesh, createEdgeLine, createVertexMesh } from '../utils';

const K33_EDGE_SEGMENTS = 300;

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

export class SurfaceSceneMöbius {
  private scene: THREE.Scene;
  private möbiusMesh: THREE.Mesh;
  private objects: THREE.Object3D[] = [];
  private meshXScale = 1.5;
  private meshYScale = 1.5;
  private morph = 0;
  private vertices: Map<number, VertexRecord> = new Map();
  private edges: Map<string, EdgeRecord> = new Map();
  private once: boolean[] = Array.from({ length: 10 }, () => false);
  private updateFunction: (value: number) => void;
  private test: boolean = false;
  private prev: number = -1;

  constructor(scene: THREE.Scene, updateFunction: (value: number) => void) {
    this.scene = scene;
    this.updateFunction = updateFunction;

    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: THREE.DoubleSide });
    const mobiusGeo = new ParametricGeometry(this.squareMöbius.bind(this), 100, 30);
    this.möbiusMesh = new THREE.Mesh(mobiusGeo, mat);
    this.setVisible(true);

    this.createK33TorusVertices();
    this.createK33TorusEdges();
    this.add(this.möbiusMesh);

    this.k33ShowVerticesAtStart();
    this.k33ShowEdgesAtStart();
  }

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  setVisible(visible: boolean): void {
    this.möbiusMesh.visible = visible;
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

    const edge = this.edges.get('3,4');
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
      { position: new THREE.Vector3(), vertex: { id: 7, x: 1, y: 0.15 } },
      { position: new THREE.Vector3(), vertex: { id: 8, x: 0, y: 0.85 } },
    ];
    const shadowEdges: GraphEdge[] = [
      [3, 7],
      [4, 8],
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

  //--------------------undo--------------------------

  _undoK33ShowVerticesAtStart(): void {
    if (!this.once[0]) {
      return;
    }
    this.once[0] = false;
    this.redrawVertices(this.vertices.values(), this.square, true, true);
  }

  _undoK33ShowEdgesAtStart(): void {
    if (!this.once[1]) {
      return;
    }
    this.once[1] = false;
    this.redrawEdges(this.edges.values(), K33_EDGE_SEGMENTS, this.square, true, true);
  }

  _undoK33FlipVertex2And5_HideAffectedEdges(): void {
    if (!this.once[2]) {
      return;
    }
    this.once[2] = false;

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

  _undoK33FlipVertex2And5_FlipVertices(): void {
    if (!this.once[3]) {
      return;
    }

    this.once[3] = false;
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

  _undoK33FlipVertex2And5_RedrawAffectedEdges(): void {
    if (!this.once[4]) {
      return;
    }
    this.once[4] = false;

    ['2,4', '2,5', '2,6', '1,5', '3,5'].forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        this.scene.remove(edge.line);
        this.edges.delete(edgeId);
      }
    });
  }

  _undoK33RouteEdge25AroundTorusSmallRadius_HideAffectedEdge(): void {
    if (!this.once[5]) {
      return;
    }
    this.once[5] = false;

    for (const id of ['3,4']) {
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

  _undoK33RouteEdge25AroundTorusSmallRadius_RedrawAffectedEdge(): void {
    if (!this.once[6]) {
      return;
    }
    this.once[6] = false;

    ['3,7', '4,8'].forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        this.scene.remove(edge.line);
        this.edges.delete(edgeId);
      }
    });

    const v7 = this.vertices.get(7);
    const v8 = this.vertices.get(8);

    if (!v7 || !v8) {
      return;
    }

    this.scene.remove(v7.mesh);
    this.scene.remove(v8.mesh);
  }

  _undoK33RouteEdge16AroundTorusLargeRadius_HideAffectedEdge(): void {
    if (!this.once[7]) {
      return;
    }
    this.once[7] = false;

    for (const id of ['1,6']) {
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

  _undoK33RouteEdge16AroundTorusLargeRadius_RedrawAffectedEdge(): void {
    if (!this.once[8]) {
      return;
    }
    this.once[8] = false;

    ['1,9', '6,10'].forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        this.scene.remove(edge.line);
        this.edges.delete(edgeId);
      }
    });

    const v9 = this.vertices.get(9);
    const v10 = this.vertices.get(10);

    if (!v9 || !v10) {
      return;
    }

    this.scene.remove(v9.mesh);
    this.scene.remove(v10.mesh);
  }

  updateSquareMöbius(s: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    const tmp = automatic ? Math.min(s * 0.4, 7) - 5 : s;
    this.morph = tmp;

    if (tmp >= 0 && tmp <= 1) {
      this.k33MorphSquareToMöbiusStrip();
    }
  }

  updateSquareMöbiusGraphEmbedding(s: number, automatic: boolean = true): void {
    if (this.test && automatic) {
      return;
    }
    if (!automatic && !this.test) {
      this.test = true;
    }

    let tmp = automatic ? Math.min(s * 0.4, 7) + 1 : s + 1;

    this.updateFunction(tmp);

    //incremental embedding -> build graph
    if (this.prev === tmp) {
      return;
    }

    if (this.prev < tmp) {
      if (tmp >= 1.5) {
        this.k33FlipVertex2And5_HideAffectedEdges();
      }
      if (tmp >= 2) {
        this.k33FlipVertex2And5_FlipVertices();
      }
      if (tmp >= 2.5) {
        this.k33FlipVertex2And5_RedrawAffectedEdges();
      }
      if (tmp >= 3) {
        this.k33RouteEdge25AroundTorusSmallRadius_HideAffectedEdge();
      }
      if (tmp >= 3.5) {
        this.k33RouteEdge25AroundTorusSmallRadius_RedrawAffectedEdge();
      }
      if (tmp >= 4) {
        this.k33RouteEdge16AroundTorusLargeRadius_HideAffectedEdge();
      }
      if (tmp >= 4.5) {
        this.k33RouteEdge16AroundTorusLargeRadius_RedrawAffectedEdge();
      }
    } else {
      //undo last action
      tmp += 0.5;
      if (tmp < 2) {
        this._undoK33FlipVertex2And5_HideAffectedEdges();
      }
      if (tmp < 2.5) {
        this._undoK33FlipVertex2And5_FlipVertices();
      }
      if (tmp < 3) {
        this._undoK33FlipVertex2And5_RedrawAffectedEdges();
      }
      if (tmp < 3.5) {
        this._undoK33RouteEdge25AroundTorusSmallRadius_HideAffectedEdge();
      }
      if (tmp < 4) {
        this._undoK33RouteEdge25AroundTorusSmallRadius_RedrawAffectedEdge();
      }
      if (tmp < 4.5) {
        this._undoK33RouteEdge16AroundTorusLargeRadius_HideAffectedEdge();
      }
      if (tmp < 5) {
        this._undoK33RouteEdge16AroundTorusLargeRadius_RedrawAffectedEdge();
      }
      tmp -= 0.5;
    }

    this.prev = tmp;
  }

  square(u: number, v: number, target: THREE.Vector3): void {
    const x = u * 2 - 1;
    const y = v * 2 - 1;
    const square = new THREE.Vector3(x * this.meshXScale, y * this.meshYScale, 0);
    target.copy(square);
  }

  squareMöbius(u: number, v: number, target: THREE.Vector3) {
    const t = this.morph;
    const scale = 1;
    const rawX = u * 2 - 1;
    const rawY = v * 2 - 1;
    const x = rawX * this.meshXScale;
    const y = rawY * this.meshYScale;
    const s = t * t * (3 - 2 * t);
    const angle = rawX * Math.PI * s;
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
    const sqX = x;
    const sqY = y;

    target.set((sqX * (1 - s) + X * s) * scale, (sqY * (1 - s) + Y * s) * scale, Z * s * scale);
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

  k33MorphSquareToMöbiusStrip(): void {
    const newTorusGeo = new ParametricGeometry(this.squareMöbius.bind(this), 80, 60);
    this.möbiusMesh.geometry.dispose();
    this.möbiusMesh.geometry = newTorusGeo;

    const joinedVertices = Array.from(this.vertices.values());
    for (let i = 0; i < joinedVertices.length; i++) {
      const v = joinedVertices[i];
      const mesh = joinedVertices[i].mesh;
      const pos = new THREE.Vector3();
      this.squareMöbius(v.data.vertex.x, v.data.vertex.y, pos);

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
        this.squareMöbius(u, vCoord, p);
        posAttr.setXYZ(j, p.x, p.y, p.z);
      }

      posAttr.needsUpdate = true;
    }
  }
}
