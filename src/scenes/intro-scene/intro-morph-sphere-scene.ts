import { BufferGeometry, Mesh, SphereGeometry, MeshStandardMaterial } from 'three';
import { IntroSceneBase } from './intro-scene-base';

export class IntroMorphSphereScene extends IntroSceneBase {
  private geometry: BufferGeometry;
  private basePositions: Float32Array;
  private baseNormals: Float32Array;
  private sphere: Mesh;
  private sphereStepStartTime;

  constructor() {
    super(true);
    const baseGeometry = new SphereGeometry(1.4, 48, 24);
    this.geometry = baseGeometry.clone();
    this.basePositions = (this.geometry.attributes.position.array as Float32Array).slice();
    this.baseNormals = (this.geometry.attributes.normal.array as Float32Array).slice();
    this.sphere = new Mesh(this.geometry, new MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
    this.sphereStepStartTime = performance.now();
    super.add(this.sphere);
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

  public override update(): void {
    const elapsed = (performance.now() - this.sphereStepStartTime) * 0.001;
    this.updateSurface(elapsed);
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.sphereStepStartTime = performance.now();
    }
    super.setVisible(visible);
  }
}
