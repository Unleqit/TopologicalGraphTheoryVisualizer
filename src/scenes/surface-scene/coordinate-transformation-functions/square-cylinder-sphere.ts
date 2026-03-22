import { Vector3 } from 'three';

export function squareCylinderSphere(u: number, v: number, target: Vector3, morph: number, xScale: number = 1, yScale: number = 1) {
  const t = morph;

  // ----- square ------
  const x = u * 2 - 1;
  const y = v * 2 - 1;
  const square = new Vector3(x * xScale, y * yScale, 0);

  // ----- cylinder -----
  const bend = Math.PI * 2 * Math.min(t * 2, 1);
  const radius = 1;
  const angle = (u - 0.5) * bend;
  const cylinder = new Vector3(Math.sin(angle) * radius, y * yScale, (1 - Math.cos(angle)) * radius - radius);

  // ----- sphere -----
  const R = 1.4;
  const theta = u * 2 * Math.PI;
  const phi = (v - 0.5) * Math.PI;
  const sphere = new Vector3(Math.cos(phi) * Math.cos(theta), Math.sin(phi), Math.cos(phi) * Math.sin(theta)).multiplyScalar(R);

  //different animations
  if (t < 0.5) {
    const k = t * 2;
    target.lerpVectors(square, cylinder, k);
  } else {
    const k = (t - 0.5) * 2;
    target.lerpVectors(cylinder, sphere, k);
  }
}
