interface BarAnimationOptions {
  titleDelayMs: number;
  stepDelayMs: number;
}

export function animateBars(selector: string, { titleDelayMs, stepDelayMs }: BarAnimationOptions): void {
  const bars = Array.from(document.querySelectorAll<HTMLElement>(selector));

  setTimeout(() => {
    bars.forEach((bar, i) => {
      setTimeout(() => {
        bar.classList.add('show');
      }, i * stepDelayMs);
    });
  }, titleDelayMs);
}
