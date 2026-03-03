import * as THREE from 'three';

export function createScene(canvas: HTMLCanvasElement): { scene: THREE.Scene<THREE.Object3DEventMap>; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer } {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 7);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(3, 4, 5);
  scene.add(dir);

  return { scene, camera, renderer };
}
