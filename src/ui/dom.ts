// Query selector helper
export function qs<T extends Element = Element>(sel: string, root: Document | Element = document): T | null {
  return root.querySelector<T>(sel);
}
