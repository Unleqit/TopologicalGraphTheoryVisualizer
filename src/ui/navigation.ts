import { clamp } from './utils';

export const MODULE_ORDER: string[] = ['intro.html', 'planarity.html', 'surfaces.html'];

// Navigate to a module by index
export function gotoModule(index: number, resetStep: boolean): void {
  const safe = clamp(index, 0, MODULE_ORDER.length - 1);

  if (resetStep) {
    sessionStorage.setItem('nav-reset-step', '1');
  }

  window.location.href = MODULE_ORDER[safe];
}

// Get index of current module in MODULE_ORDER
export function getModuleIndex(): number {
  const file = location.pathname.split('/').pop() || 'intro.html';
  const idx = MODULE_ORDER.indexOf(file);
  return idx >= 0 ? idx : 0;
}
