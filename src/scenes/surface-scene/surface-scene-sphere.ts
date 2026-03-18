import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { _3DGraphVertex } from '../../graph/graph-3d-vertex';
import { GraphEdge } from '../../graph/graph-edge';
import { createVertexMeshes, createEdgeLines } from '../utils';

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

export class SurfaceSceneSphere {
  private scene: THREE.Scene;
  private squareCylinderSphereMesh: THREE.Mesh;
  private vertexMeshes: THREE.Mesh[] = [];
  private edgeLines: THREE.Line[] = [];
  private objects: THREE.Object3D[] = [];
  private morph = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: THREE.DoubleSide });
    const geo = new ParametricGeometry(this.squareCylinderSphere.bind(this), 140, 80);

    this.squareCylinderSphereMesh = new THREE.Mesh(geo, mat);

    const vertexMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.vertexMeshes = createVertexMeshes(vertexMat, vertices, true);
    this.vertexMeshes.forEach((v) => this.scene.add(v));

    this.edgeLines = createEdgeLines(edges, EDGE_SEGMENTS, true);
    this.edgeLines.forEach((e) => this.scene.add(e));

    this.add(this.squareCylinderSphereMesh);
  }

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  setVisible(visible: boolean) {
    this.squareCylinderSphereMesh.visible = visible;
    this.vertexMeshes.forEach((mesh) => (mesh.visible = visible));
    this.edgeLines.forEach((line) => (line.visible = visible));
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
}
