import * as THREE from 'three';

export class IntroScene {
  readonly scene = new THREE.Scene();
  private objects: THREE.Object3D[] = [];

  private sphere: THREE.Mesh;
  private torus: THREE.Mesh;
  private mobius: THREE.Mesh;

  constructor() {
    this.sphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 48, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));

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

  update(time: number): void {
    const s = time * 0.001;

    this.objects.forEach((o) => {
      o.rotation.y = s * 0.45;
      o.rotation.x = s * 0.2;
    });
  }
}
