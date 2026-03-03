import { qs } from './dom';
import { getModuleIndex, gotoModule, MODULE_ORDER } from './navigation';
import { clamp } from './utils';

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
