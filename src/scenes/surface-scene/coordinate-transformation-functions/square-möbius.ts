import { Vector3 } from 'three';

export function squareMöbius(u: number, v: number, target: Vector3, morph: number, xScale: number = 1, yScale: number = 1): void {
  const t = morph;
  const scale = 1;
  const rawX = u * 2 - 1;
  const rawY = v * 2 - 1;
  const x = rawX * xScale;
  const y = rawY * yScale;
  const s = t * t * (3 - 2 * t);
  const angle = rawX * Math.PI * s;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const R = 1.3;
  const width = y * (1.5 * (1 - s) + 0.35 * s);
  const twist = angle * 0.5 * s;
  const cosT = Math.cos(twist);
  const sinT = Math.sin(twist);
  const r = R + width * cosT;
  const X = r * cosA;
  const Y = r * sinA;
  const Z = width * sinT;
  const sqX = x;
  const sqY = y;

  target.set((sqX * (1 - s) + X * s) * scale, (sqY * (1 - s) + Y * s) * scale, Z * s * scale);
}
