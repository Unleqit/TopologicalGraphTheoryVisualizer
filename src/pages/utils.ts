import { PerspectiveCamera, Scene, AmbientLight, DirectionalLight, WebGLRenderer } from 'three';

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 7);
  return camera;
}

export function addDefaultLights(scene: Scene): void {
  scene.add(new AmbientLight(0xffffff, 0.6));

  const dir = new DirectionalLight(0xffffff, 0.9);
  dir.position.set(3, 4, 5);
  scene.add(dir);
}

export function createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
  return new WebGLRenderer({ canvas, antialias: true, alpha: true });
}
