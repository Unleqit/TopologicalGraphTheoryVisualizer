// Clamp a number between a and b
export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}
