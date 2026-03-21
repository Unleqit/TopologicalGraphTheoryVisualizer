import { Vector3 } from 'three';

export function squareCylinderTorus(u: number, v: number, target: Vector3, morph: number, xScale: number = 1, yScale: number = 1): void {
  const t = morph;

  // ----- square ------
  const x = u * 2 - 1;
  const y = v * 2 - 1;
  const square = new Vector3(x * xScale, y * yScale, 0);

  // ----- cylinder -----
  const bend = Math.PI * 2 * Math.min(t * 2, 1);
  const radius = 1;
  const angle = (v - 0.15) * bend;
  const cylinder = new Vector3(x * xScale, Math.sin(angle) * radius, (1 - Math.cos(angle)) * radius - radius);

  // ------ torus --------
  const L = 3.0;
  const baseRadius = 1.2;
  const tubeScale = 0.7;
  const bendFactor = Math.max(t * 2 - 1, 0);
  const torusBend = bendFactor * Math.PI * 2;
  const bendRadius = L / Math.max(torusBend, 1e-5);
  const majorRadius = bendRadius + baseRadius;
  const a = (x * xScale) / bendRadius;
  const scaledTube = cylinder.z * tubeScale * bendFactor;
  const radius2 = bendFactor * majorRadius + (1 - bendFactor) * 0;
  const torus = new Vector3((1 - bendFactor) * x + Math.sin(a) * (radius2 + scaledTube), cylinder.y, (1 - bendFactor) * cylinder.z + Math.cos(a) * (radius2 + scaledTube));

  //different animations
  if (t < 0.5) {
    const k = t * 2;
    target.lerpVectors(square, cylinder, k);
  } else {
    const k = (t - 0.5) * 2;
    target.lerpVectors(cylinder, torus, k);
  }
}
