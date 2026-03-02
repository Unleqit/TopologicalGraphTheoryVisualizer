// common.ts
export const MODULE_ORDER: string[] = ['intro.html', 'planarity.html', 'surfaces.html'];

// Clamp a number between a and b
export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

// Query selector helper
export function qs<T extends Element = Element>(sel: string, root: Document | Element = document): T | null {
  return root.querySelector<T>(sel);
}

// Get index of current module in MODULE_ORDER
export function getModuleIndex(): number {
  const file = location.pathname.split('/').pop() || 'intro.html';
  const idx = MODULE_ORDER.indexOf(file);
  return idx >= 0 ? idx : 0;
}

// Navigate to a module by index
export function gotoModule(index: number): void {
  const safe = clamp(index, 0, MODULE_ORDER.length - 1);
  window.location.href = MODULE_ORDER[safe];
}

// Setup stepper UI
export function setupStepper(): { getStep: () => number; setStep: (s: number) => void; totalSteps: number } {
  const dialogSteps: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('[data-step]')).sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

  const totalSteps: number = Math.max(1, dialogSteps.length);
  let step: number = 0;

  function render(): void {
    dialogSteps.forEach((el, i) => {
      el.style.display = i === step ? 'block' : 'none';
    });

    const prog = qs<HTMLSpanElement>('#progress');
    if (prog) {
      prog.textContent = `Step ${step + 1} / ${totalSteps}`;
    }

    const prevBtn = qs<HTMLButtonElement>('#prevBtn');
    if (prevBtn) {
      prevBtn.disabled = step === 0 && getModuleIndex() === 0;
    }
  }

  const prevBtn = qs<HTMLButtonElement>('#prevBtn');
  prevBtn?.addEventListener('click', () => {
    if (step > 0) {
      step--;
      render();
      return;
    }
    const mi = getModuleIndex();
    if (mi > 0) {
      gotoModule(mi - 1);
    }
  });

  const nextBtn = qs<HTMLButtonElement>('#nextBtn');
  nextBtn?.addEventListener('click', () => {
    if (step < totalSteps - 1) {
      step++;
      render();
      return;
    }
    const mi = getModuleIndex();
    if (mi < MODULE_ORDER.length - 1) {
      gotoModule(mi + 1);
    }
  });

  render();

  return {
    getStep: (): number => step,
    setStep: (s: number): void => {
      step = clamp(s, 0, totalSteps - 1);
      render();
    },
    totalSteps,
  };
}
