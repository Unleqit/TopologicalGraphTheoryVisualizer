import '../styles/base.css';
import { IntroScene } from '../scenes/intro-scene';
import { createCamera } from '../threejs/camera';
import { addDefaultLights } from '../threejs/lights';
import { createRenderer } from '../threejs/renderer';
import { setupStepper } from '../ui/setup-stepper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stepper = setupStepper();

const canvas = document.getElementById('viz') as HTMLCanvasElement;
const slider = document.getElementById('uSlider') as HTMLInputElement;
const readout = document.getElementById('readout') as HTMLElement;
const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
const resetBtn2 = document.getElementById('resetBtn2') as HTMLButtonElement;
const mobiusSlider = document.getElementById('mobiusSlider') as HTMLInputElement;
const mobiusReadout = document.getElementById('mobiusReadout') as HTMLElement;

// Update cylinder arrow based on slider
slider.addEventListener('input', () => {
  const t = Number(slider.value) / 1000; // normalize 0..2 loops
  introScene.updateFromSlider(t);
  readout.textContent = `turns = ${t.toFixed(3)}`;
});

// Hook buttons
resetBtn.addEventListener('click', () => {
  slider.value = '0';
  slider.dispatchEvent(new Event('input'));
});

// Hook buttons
resetBtn2.addEventListener('click', () => {
  mobiusSlider.value = '0';
  mobiusSlider.dispatchEvent(new Event('input'));
});

mobiusSlider.addEventListener('input', () => {
  const turns = Number(mobiusSlider.value) / 1000; // 0..1
  introScene.moveMobiusArrow(turns);
  mobiusReadout.textContent = `turns = ${turns.toFixed(3)}`;
});

const handleBtn = document.getElementById('handleBtn') as HTMLButtonElement;

handleBtn.addEventListener('click', () => {
  if (!introScene.isHandleAdded()) {
    handleBtn.textContent = 'Reset Handle';
    introScene.startHandleMorphManual();
  } else {
    handleBtn.textContent = 'Show Handle';
    introScene.resetHandle();
  }
});

const renderer = createRenderer(canvas);
const camera = createCamera();
const introScene = new IntroScene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

addDefaultLights(introScene.scene);

let lastStep = stepper.getStep();
introScene.applyStep(lastStep);

function resize(): void {
  const area = document.querySelector('.canvasArea') as HTMLElement;
  if (!area) {
    return;
  }

  const w = area.clientWidth;
  const h = area.clientHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
resize();

function tick(t: number) {
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;

    controls.target.set(0, 0, 0);
    introScene.applyStep(cur);

    // update slider/arrow for step 1 immediately
    if (cur === 1) {
      slider.dispatchEvent(new Event('input'));
    }

    switch (cur) {
      case 0:
        controls.object.position.set(0, 0, 8);
        break;
      case 1:
        controls.object.position.set(-2, -2, 5);
        break;
      case 2:
        controls.object.position.set(2, 4, 4);
        break;
      case 3:
        controls.object.position.set(0, 0, 8);
        break;
    }
  }

  introScene.update(t);
  controls.update();
  renderer.render(introScene.scene, camera);

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
