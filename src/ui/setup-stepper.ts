import { qs } from './dom';
import { getModuleIndex, gotoModule, MODULE_ORDER } from './navigation';
import { clamp } from './utils';

export class Stepper {
  private step: number;
  private totalSteps: number;
  private dialogSteps: HTMLElement[];

  constructor() {
    this.dialogSteps = Array.from(document.querySelectorAll<HTMLElement>('[data-step]')).sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

    this.totalSteps = Math.max(1, this.dialogSteps.length);

    const prev = [3, 0, 0];
    const resetStep = sessionStorage.getItem('nav-reset-step') === '1';
    sessionStorage.removeItem('nav-reset-step');

    const saved = Number(sessionStorage.getItem(this.getStorageKey()));

    if (resetStep) {
      this.step = 0;
    } else if (Number.isFinite(saved)) {
      this.step = saved;
    } else {
      this.step = prev[getModuleIndex()];
    }

    const prevBtn = qs<HTMLButtonElement>('#prevBtn');
    prevBtn?.addEventListener('click', () => {
      if (this.step > 0) {
        this.step--;
        this.render();
        return;
      }
      const mi = getModuleIndex();
      if (mi > 0) {
        gotoModule(mi - 1, false);
      }
    });

    const nextBtn = qs<HTMLButtonElement>('#nextBtn');
    nextBtn?.addEventListener('click', () => {
      if (this.step < this.totalSteps - 1) {
        this.step++;
        this.render();
        return;
      }
      const mi = getModuleIndex();
      if (mi < MODULE_ORDER.length - 1) {
        gotoModule(mi + 1, false);
      }
    });

    this.render();
  }

  private render(): void {
    this.dialogSteps.forEach((el, i) => {
      el.style.display = i === this.step ? 'block' : 'none';
    });

    const prog = qs<HTMLSpanElement>('#progress');
    if (prog && this.totalSteps > 1) {
      prog.textContent = `Step ${this.step + 1} / ${this.totalSteps}`;
    }

    const prevBtn = qs<HTMLButtonElement>('#prevBtn');
    if (prevBtn) {
      prevBtn.disabled = this.step === 0 && getModuleIndex() === 0;
    }

    const nextBtn = qs<HTMLButtonElement>('#nextBtn');
    if (nextBtn) {
      const isLastStep = this.step === this.totalSteps - 1;
      const isLastModule = getModuleIndex() === MODULE_ORDER.length - 1;

      nextBtn.disabled = isLastStep && isLastModule;
    }

    sessionStorage.setItem(this.getStorageKey(), String(this.step));
  }

  getStep(): number {
    return this.step;
  }

  setStep(s: number): void {
    this.step = clamp(s, 0, this.totalSteps - 1);
    this.render();
  }

  getTotalSteps(): number {
    return this.totalSteps;
  }

  private getStorageKey(): string {
    return `stepper-step-${getModuleIndex()}`;
  }
}
/*import { qs } from './dom';
import { getModuleIndex, gotoModule, MODULE_ORDER } from './navigation';
import { clamp } from './utils';

// Setup stepper UI
export function setupStepper(): { getStep: () => number; setStep: (s: number) => void; totalSteps: number } {
  const dialogSteps: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('[data-step]')).sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

  const totalSteps: number = Math.max(1, dialogSteps.length);

  const prev = [3, 0, 0];
  const resetStep = sessionStorage.getItem('nav-reset-step') === '1';
  sessionStorage.removeItem('nav-reset-step');

  const saved = Number(sessionStorage.getItem(getStorageKey()));
  let step: number;

  if (resetStep) {
    step = 0;
  } else if (Number.isFinite(saved)) {
    step = saved;
  } else {
    step = prev[getModuleIndex()];
  }

  function render(): void {
    dialogSteps.forEach((el, i) => {
      el.style.display = i === step ? 'block' : 'none';
    });

    const prog = qs<HTMLSpanElement>('#progress');
    if (prog && totalSteps > 1) {
      prog.textContent = `Step ${step + 1} / ${totalSteps}`;
    }

    const prevBtn = qs<HTMLButtonElement>('#prevBtn');
    if (prevBtn) {
      prevBtn.disabled = step === 0 && getModuleIndex() === 0;
    }

    const nextBtn = qs<HTMLButtonElement>('#nextBtn');
    if (nextBtn) {
      const isLastStep = step === totalSteps - 1;
      const isLastModule = getModuleIndex() === MODULE_ORDER.length - 1;

      nextBtn.disabled = isLastStep && isLastModule;
    }

    sessionStorage.setItem(getStorageKey(), String(step));
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
      gotoModule(mi - 1, false);
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
      gotoModule(mi + 1, false);
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

function getStorageKey(): string {
  return `stepper-step-${getModuleIndex()}`;
}
*/
