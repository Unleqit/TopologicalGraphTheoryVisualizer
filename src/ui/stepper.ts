import { qs } from './dom';
import { getModuleIndex, gotoModule, MODULE_ORDER } from './navigation';
import { clamp } from './utils';

const stepCountPerModule: number[] = [3, 0, 0];

export class Stepper {
  private dialogSteps: HTMLElement[];
  private totalSteps: number;
  private currentStep: number;

  constructor() {
    this.dialogSteps = Array.from(document.querySelectorAll<HTMLElement>('[data-step]')).sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));
    this.totalSteps = Math.max(1, this.dialogSteps.length);
    this.currentStep = Number(sessionStorage.getItem(this.getStorageKey()) ?? stepCountPerModule[getModuleIndex()]);

    const prevBtn = qs<HTMLButtonElement>('#prevBtn');
    prevBtn?.addEventListener('click', () => {
      if (this.currentStep > 0) {
        this.currentStep--;
        this.render();
        return;
      }
      const mi = getModuleIndex();
      if (mi > 0) {
        gotoModule(mi - 1);
      }
    });

    const nextBtn = qs<HTMLButtonElement>('#nextBtn');
    nextBtn?.addEventListener('click', () => {
      if (this.currentStep < this.totalSteps - 1) {
        this.currentStep++;
        this.render();
        return;
      }
      const mi = getModuleIndex();
      if (mi < MODULE_ORDER.length - 1) {
        gotoModule(mi + 1);
      }
    });

    this.render();
  }

  private render(): void {
    this.dialogSteps.forEach((el, i) => {
      el.style.display = i === this.currentStep ? 'block' : 'none';
    });

    const prog = qs<HTMLSpanElement>('#progress');
    if (prog && this.totalSteps > 1) {
      prog.textContent = `Step ${this.currentStep + 1} / ${this.totalSteps}`;
    }

    const prevBtn = qs<HTMLButtonElement>('#prevBtn');
    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 0 && getModuleIndex() === 0;
    }

    const nextBtn = qs<HTMLButtonElement>('#nextBtn');
    if (nextBtn) {
      const isLastStep = this.currentStep === this.totalSteps - 1;
      const isLastModule = getModuleIndex() === MODULE_ORDER.length - 1;

      nextBtn.disabled = isLastStep && isLastModule;
    }

    sessionStorage.setItem(this.getStorageKey(), String(this.currentStep));
  }

  public getStep(): number {
    return this.currentStep;
  }

  public setStep(s: number): void {
    this.currentStep = clamp(s, 0, this.totalSteps - 1);
    this.render();
  }

  public getStorageKey(): string {
    return `stepper-step-${getModuleIndex()}`;
  }
}
