import { qs } from './dom';
import { getModuleIndex, gotoModule, MODULE_ORDER } from './navigation';
import { clamp } from './utils';

export class Stepper extends EventTarget {
  private step: number;
  private totalSteps: number;
  private dialogSteps: HTMLElement[];

  constructor() {
    super();
    this.dialogSteps = Array.from(document.querySelectorAll<HTMLElement>('[data-step]')).sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));

    this.totalSteps = Math.max(1, this.dialogSteps.length);

    const stepMode = sessionStorage.getItem('nav-step-mode');
    sessionStorage.removeItem('nav-step-mode');

    if (stepMode === 'last') {
      this.step = this.totalSteps - 1;
    } else {
      this.step = 0;
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
        gotoModule(mi - 1, 'last');
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
        gotoModule(mi + 1, 'first');
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

    this.dispatchEvent(new CustomEvent<number>('stepchange', { detail: this.step }));
  }

  getStep(): number {
    return this.step;
  }

  setStep(s: number): void {
    const newStep = clamp(s, 0, this.totalSteps - 1);
    if (newStep === this.step) {
      return;
    }

    this.step = newStep;
    this.render();
  }

  getTotalSteps(): number {
    return this.totalSteps;
  }
}
