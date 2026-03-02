// common.js
export const MODULE_ORDER = ["intro.html", "planarity.html", "surfaces.html"];

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function qs(sel, root=document){ return root.querySelector(sel); }

export function getModuleIndex(){
  const file = location.pathname.split("/").pop() || "intro.html";
  const idx = MODULE_ORDER.indexOf(file);
  return idx >= 0 ? idx : 0;
}

export function gotoModule(index){
  const safe = clamp(index, 0, MODULE_ORDER.length - 1);
  window.location.href = MODULE_ORDER[safe];
}

export function setupStepper(){
  const dialogSteps = Array.from(document.querySelectorAll("[data-step]"))
  .sort((a,b) => Number(a.dataset.step) - Number(b.dataset.step));

  const totalSteps = Math.max(1, dialogSteps.length);
  let step = 0;

  function render(){
    dialogSteps.forEach((el, i) => el.style.display = (i === step) ? "block" : "none");
    const prog = qs("#progress");
    if (prog) prog.textContent = `Step ${step + 1} / ${totalSteps}`;

    const prevBtn = qs("#prevBtn");
    if (prevBtn) prevBtn.disabled = (step === 0 && getModuleIndex() === 0);
  }

  qs("#prevBtn")?.addEventListener("click", () => {
    if (step > 0) { step--; render(); return; }
    const mi = getModuleIndex();
    if (mi > 0) gotoModule(mi - 1);
  });

  qs("#nextBtn")?.addEventListener("click", () => {
    if (step < totalSteps - 1) { step++; render(); return; }
    const mi = getModuleIndex();
    if (mi < MODULE_ORDER.length - 1) gotoModule(mi + 1);
  });

  render();
  return {
    getStep: () => step,
    setStep: (s) => { step = clamp(s, 0, totalSteps - 1); render(); },
    totalSteps
  };
}


