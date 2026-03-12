import * as THREE from 'three';
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';

export class SurfaceScene {
  readonly scene = new THREE.Scene();

  private squareCylinderSphereMesh: THREE.Mesh;
  private squareCylinderTorusMesh: THREE.Mesh;
  private möbiusMesh: THREE.Mesh;

  private objects: THREE.Object3D[] = [];

  private morph = 0;
  private torusMorph = 0;
  private möbiusMorph = 0;
  private stepStartTime = 0;
  private currentStep = 0;

  constructor() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, side: THREE.DoubleSide });
    const geo = new ParametricGeometry(this.squareCylinderSphere.bind(this), 140, 80);
    const torusGeo = new ParametricGeometry(this.squareCylinderTorus.bind(this), 80, 60);
    const mobiusGeo = new ParametricGeometry(this.squareMöbius.bind(this), 100, 30);

    this.squareCylinderSphereMesh = new THREE.Mesh(geo, mat);
    this.squareCylinderTorusMesh = new THREE.Mesh(torusGeo, mat);
    this.möbiusMesh = new THREE.Mesh(mobiusGeo, mat);

    this.squareCylinderTorusMesh.visible = false;
    this.möbiusMesh.visible = false;

    this.add(this.squareCylinderSphereMesh);
    this.add(this.squareCylinderTorusMesh);
    this.add(this.möbiusMesh);
  }

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  applyStep(step: number, time: number): void {
    if (step !== this.currentStep) {
      this.currentStep = step;
      this.stepStartTime = time; // restart animation
    }

    this.squareCylinderSphereMesh.visible = step === 0;
    this.squareCylinderTorusMesh.visible = step === 1;
    this.möbiusMesh.visible = step === 2;
  }

  update(time: number): void {
    const s = (time - this.stepStartTime) * 0.001;

    this.morph = (Math.sin(s * 0.4 - Math.PI / 2) + 1) * 0.5;
    this.torusMorph = (Math.sin(s * 0.4 - Math.PI / 2) + 1) * 0.5;
    this.möbiusMorph = (Math.sin(s * 0.4 - Math.PI / 2) + 1) * 0.5;

    const newGeo = new ParametricGeometry(this.squareCylinderSphere.bind(this), 140, 80);
    this.squareCylinderSphereMesh.geometry.dispose();
    this.squareCylinderSphereMesh.geometry = newGeo;

    const newTorusGeo = new ParametricGeometry(this.squareCylinderTorus.bind(this), 80, 60);
    this.squareCylinderTorusMesh.geometry.dispose();
    this.squareCylinderTorusMesh.geometry = newTorusGeo;

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
