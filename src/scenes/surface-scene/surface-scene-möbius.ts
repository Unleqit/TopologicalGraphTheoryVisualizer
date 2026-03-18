import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { _3DGraphVertex } from '../../graph/graph-3d-vertex';
import { GraphEdge } from '../../graph/graph-edge';

const EDGE_SEGMENTS = 80;

export class SurfaceSceneMöbius {
  private scene: THREE.Scene;
  private möbiusMesh: THREE.Mesh;
  private objects: THREE.Object3D[] = [];
  private morph = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: false, side: THREE.DoubleSide });
    const mobiusGeo = new ParametricGeometry(this.squareMöbius.bind(this), 100, 30);
    this.möbiusMesh = new THREE.Mesh(mobiusGeo, mat);
    this.möbiusMesh.visible = false;
    this.add(this.möbiusMesh);
  }

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  setVisible(visible: boolean) {
    this.möbiusMesh.visible = visible;
    //  this.vertexMeshes.forEach((mesh) => (mesh.visible = visible));
    //this.edgeLines.forEach((line) => (line.visible = visible));
  }

  updateSquareMöbius(s: number) {
    this.morph = (Math.sin(s * 0.4 - Math.PI / 2) + 1) * 0.5;

    const newMöbiusGeo = new ParametricGeometry(this.squareMöbius.bind(this), 80, 60);
    this.möbiusMesh.geometry.dispose();
    this.möbiusMesh.geometry = newMöbiusGeo;
  }

  squareMöbius(u: number, v: number, target: THREE.Vector3) {
    const t = this.morph;

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
