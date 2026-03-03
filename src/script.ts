import './styles/base.css';
import './styles/styles.css';

// Title element
const titleEl = document.getElementById('title') as HTMLElement | null;
if (titleEl) {
  // Add enter animation
  titleEl.classList.add('enter');
}

// Select all bars
const bars: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>('.bar'));

// Animation delays
const titleDelayMs = 950;
const stepDelayMs = 240;

// Animate bars after title
setTimeout(() => {
  bars.forEach((bar, i) => {
    setTimeout(() => bar.classList.add('show'), i * stepDelayMs);
  });
}, titleDelayMs);

// Fill descriptions + click-to-expand
bars.forEach((bar) => {
  const desc = bar.getAttribute('data-desc') || '';
  const descEl = bar.querySelector<HTMLElement>('.bar-desc');
  if (descEl) {
    descEl.textContent = desc;
  }

  // CTA click should navigate only
  const cta = bar.querySelector<HTMLElement>('.bar-cta');
  if (cta) {
    cta.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation(); // prevent bar toggling
      // normal navigation allowed
    });
  }

  // Toggle bar open/close on click
  bar.addEventListener('click', () => {
    const isOpen = bar.classList.toggle('open');
    bar.setAttribute('aria-expanded', String(isOpen));

    if (descEl) {
      descEl.setAttribute('aria-hidden', String(!isOpen));
    }

    // Close other bars when opening one
    if (isOpen) {
      bars.forEach((other) => {
        if (other !== bar) {
          other.classList.remove('open');
          other.setAttribute('aria-expanded', 'false');
          const otherDesc = other.querySelector<HTMLElement>('.bar-desc');
          if (otherDesc) {
            otherDesc.setAttribute('aria-hidden', 'true');
          }
        }
      });
    }
  });
});
