import { Vector3 } from 'three';

export function square(u: number, v: number, target: Vector3, xScale: number = 1, yScale: number = 1): void {
  const x = u * 2 - 1;
  const y = v * 2 - 1;
  const square = new Vector3(x * xScale, y * yScale, 0);
  target.copy(square);
}
