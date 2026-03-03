export function animateTitle(id: string): void {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }

  el.classList.add('enter');
}
