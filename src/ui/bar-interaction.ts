export function setupBars(selector: string): void {
  const bars = Array.from(document.querySelectorAll<HTMLElement>(selector));

  bars.forEach((bar) => {
    const descText = bar.getAttribute('data-desc') || '';
    const descEl = bar.querySelector<HTMLElement>('.bar-desc');
    const cta = bar.querySelector<HTMLElement>('.bar-cta');

    // Fill description
    if (descEl) {
      descEl.textContent = descText;
    }

    // CTA click: prevent toggle
    if (cta) {
      cta.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Toggle open/close
    bar.addEventListener('click', () => {
      toggleBar(bar, bars);
    });
  });
}

function toggleBar(bar: HTMLElement, allBars: HTMLElement[]): void {
  const isOpen = bar.classList.toggle('open');
  bar.setAttribute('aria-expanded', String(isOpen));

  const descEl = bar.querySelector<HTMLElement>('.bar-desc');
  if (descEl) {
    descEl.setAttribute('aria-hidden', String(!isOpen));
  }

  if (!isOpen) {
    return;
  }

  // Close others
  allBars.forEach((other) => {
    if (other === bar) {
      return;
    }

    other.classList.remove('open');
    other.setAttribute('aria-expanded', 'false');

    const otherDesc = other.querySelector<HTMLElement>('.bar-desc');
    if (otherDesc) {
      otherDesc.setAttribute('aria-hidden', 'true');
    }
  });
}
