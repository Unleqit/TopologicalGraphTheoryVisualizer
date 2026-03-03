import * as THREE from 'three';

export function createNodeCircle(): THREE.Mesh {
  return new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshBasicMaterial({ color: 0x1976d2 }));
}
