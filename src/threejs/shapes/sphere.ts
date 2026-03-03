import * as THREE from 'three';

export function createSphere(): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(1.4, 48, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
}
