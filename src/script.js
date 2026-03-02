import './base.css';
import './styles.css';

const titleEl = document.getElementById('title');
const bars = Array.from(document.querySelectorAll('.bar'));

// Title anim
titleEl.classList.add('enter');

// Bars appear after title
const titleDelayMs = 950;
const stepDelayMs = 240;

setTimeout(() => {
  bars.forEach((bar, i) => {
    setTimeout(() => bar.classList.add('show'), i * stepDelayMs);
  });
}, titleDelayMs);

// Fill descriptions + click-to-expand
bars.forEach((bar) => {
  const desc = bar.getAttribute('data-desc') || '';
  const descEl = bar.querySelector('.bar-desc');
  if (descEl) descEl.textContent = desc;

  // Clicking CTA should navigate only (and NOT toggle)
  const cta = bar.querySelector('.bar-cta');
  if (cta) {
    cta.addEventListener('click', (e) => {
      e.stopPropagation(); // prevents bar click toggling
      // allow normal navigation
    });
  }

  bar.addEventListener('click', () => {
    const isOpen = bar.classList.toggle('open');
    bar.setAttribute('aria-expanded', String(isOpen));

    if (descEl) descEl.setAttribute('aria-hidden', String(!isOpen));

    // Optional: close others when opening one
    if (isOpen) {
      bars.forEach((other) => {
        if (other !== bar) {
          other.classList.remove('open');
          other.setAttribute('aria-expanded', 'false');
          const otherDesc = other.querySelector('.bar-desc');
          if (otherDesc) otherDesc.setAttribute('aria-hidden', 'true');
        }
      });
    }
  });
});
