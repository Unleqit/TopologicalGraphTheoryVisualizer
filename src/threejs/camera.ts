import * as THREE from 'three';

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 0, 7);
  return camera;
}

export function centerGroup(group: THREE.Group, camera: THREE.PerspectiveCamera): void {
  const box = new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  group.position.sub(sphere.center);
  camera.position.set(0, 0, sphere.radius * 3);
}
