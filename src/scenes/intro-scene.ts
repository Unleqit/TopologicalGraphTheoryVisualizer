import * as THREE from 'three';

export class IntroScene {
  readonly scene = new THREE.Scene();
  private objects: THREE.Object3D[] = [];

  private sphere: THREE.Mesh;
  private sphereWire: THREE.Mesh;

  private torus: THREE.Mesh;
  private mobius: THREE.Mesh;

  //sphere morphing
  private geometry: THREE.BufferGeometry;
  private basePositions: Float32Array;
  private baseNormals: Float32Array;

  constructor() {
    const baseGeometry = new THREE.SphereGeometry(1.4, 48, 24);
    this.geometry = baseGeometry.clone();

    this.basePositions = (this.geometry.attributes.position.array as Float32Array).slice();
    this.baseNormals = (this.geometry.attributes.normal.array as Float32Array).slice();

    this.sphere = new THREE.Mesh(this.geometry, new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
    this.sphereWire = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.2 }));

    this.sphere.add(this.sphereWire);

    this.torus = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.5, 22, 80), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
    this.mobius = new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.35, 140, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));

    this.torus.visible = false;
    this.mobius.visible = false;

    this.add(this.sphere);
    this.add(this.torus);
    this.add(this.mobius);
  }

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  applyStep(step: number): void {
    this.sphere.visible = step === 0;
    this.torus.visible = step === 1;
    this.mobius.visible = step === 2;
  }

  private smoothPulse(t: number): number {
    return 0.5 + 0.5 * Math.sin(t);
  }

  private modeWeights(t: number): [number, number, number] {
    const a = this.smoothPulse(t * 0.7);
    const b = this.smoothPulse(t * 0.7 + (Math.PI * 2) / 3);
    const c = this.smoothPulse(t * 0.7 + (Math.PI * 4) / 3);
    const sum = a + b + c;
    return [a / sum, b / sum, c / sum];
  }

  private updateSurface(time: number): void {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const [wSphere, wCube, wWave] = this.modeWeights(time);

    for (let i = 0; i < pos.length; i += 3) {
      const x0 = this.basePositions[i];
      const y0 = this.basePositions[i + 1];
      const z0 = this.basePositions[i + 2];

      const nx = this.baseNormals[i];
      const ny = this.baseNormals[i + 1];
      const nz = this.baseNormals[i + 2];

      const r = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0);

      const sphereRadius = r * (1 + 0.05 * Math.sin(3 * nx + time * 1.3) * Math.sin(3 * ny - time * 0.9));

      const ax = Math.abs(nx);
      const ay = Math.abs(ny);
      const az = Math.abs(nz);

      const cubeFactor = Math.pow(Math.pow(ax, 10) + Math.pow(ay, 10) + Math.pow(az, 10), -1 / 10);

      const cubeRadius = r * cubeFactor * 1.08;

      const wave =
        0.2 * Math.sin(4 * nx + time * 1.7) + 0.16 * Math.sin(5 * ny - time * 1.2) + 0.12 * Math.sin(6 * nz + time * 1.9) + 0.08 * Math.sin(7 * (nx + ny + nz) - time * 1.1);

      const waveRadius = r * (1 + wave);

      const blended = wSphere * sphereRadius + wCube * cubeRadius + wWave * waveRadius;

      pos[i] = nx * blended;
      pos[i + 1] = ny * blended;
      pos[i + 2] = nz * blended;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  update(time: number): void {
    const s = time * 0.001;
    this.updateSurface(s);

    this.objects.forEach((o) => {
      o.rotation.y = s * 0.45;
      o.rotation.x = s * 0.2;
    });
  }
}
