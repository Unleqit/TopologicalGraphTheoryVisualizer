import '../../styles/base.css';
import { SurfaceScene } from '../../scenes/surface-scene/surface-scene';
import { setupStepper } from '../../ui/setup-stepper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { addDefaultLights, createCamera, createRenderer } from '../utils';
import { VisualizationContextUpdateUISource } from '../../scenes/surface-scene/visualization/types/visualization-context-ui-update-source';
import { VisualizationContextUIDisplayResult } from '../../scenes/surface-scene/visualization/types/visualization-context-ui-display-result';

//--- sphere ---
const slider_1 = document.getElementById('slider-1') as HTMLInputElement;
const slider0 = document.getElementById('slider0') as HTMLInputElement;
const readout_1 = document.getElementById('readout-1') as HTMLElement;
const readout0 = document.getElementById('readout0') as HTMLElement;

//--- torus ---
const slider1 = document.getElementById('slider1') as HTMLInputElement;
const slider2 = document.getElementById('slider2') as HTMLInputElement;
const readout1 = document.getElementById('readout1') as HTMLElement;
const readout2 = document.getElementById('readout2') as HTMLElement;

//--- möbius ---
const slider3 = document.getElementById('slider3') as HTMLInputElement;
const slider4 = document.getElementById('slider4') as HTMLInputElement;
const readout3 = document.getElementById('readout3') as HTMLElement;
const readout4 = document.getElementById('readout4') as HTMLElement;

slider_1.addEventListener('input', () => {
  const t = Number(slider_1.value);
  surfaceScene.onSlider1Change(t, Number.parseFloat(slider0.value));
});

slider0.addEventListener('input', () => {
  const t = Number(slider0.value);
  surfaceScene.onSlider2Change(t);
  readout0.textContent = `Morph: ${(t * 100 + 0.4).toFixed(0)}%`;
});

slider1.addEventListener('input', () => {
  const t = Number(slider1.value);
  surfaceScene.onSlider1Change(t, Number.parseFloat(slider2.value));
});

slider2.addEventListener('input', () => {
  const t = Number(slider2.value);
  surfaceScene.onSlider2Change(t);
  readout2.textContent = `Morph: ${(t * 100 + 0.4).toFixed(0)}%`;
});

slider3.addEventListener('input', () => {
  const t = Number(slider3.value);
  surfaceScene.onSlider1Change(t, Number.parseFloat(slider4.value));
});

slider4.addEventListener('input', () => {
  const t = Number(slider4.value);
  surfaceScene.onSlider2Change(t);
  readout4.textContent = `Morph: ${(t * 100 + 0.4).toFixed(0)}`;
});

function updateSlidersSphere(result: VisualizationContextUIDisplayResult, source: VisualizationContextUpdateUISource): void {
  if (source === 'reorder' && result.normedStepValue <= 1) {
    slider_1.value = result.normedStepValue.toFixed(3);
    readout_1.textContent = `Step ${result.stepValue}: ${result.description}`;
  }
  if (source === 'transform' && result.normedStepValue >= 0 && result.normedStepValue <= 1) {
    slider0.value = result.normedStepValue.toFixed(3);
    readout0.textContent = `Morph: ${(result.normedStepValue * 100 + 0.4).toFixed(0)}%`;
  }
}

function updateSlidersTorus(result: VisualizationContextUIDisplayResult, source: VisualizationContextUpdateUISource): void {
  if (source === 'reorder' && result.normedStepValue <= 1) {
    slider1.value = result.normedStepValue.toFixed(3);
    readout1.textContent = `Step ${result.stepValue}: ${result.description}`;
  }
  if (source === 'transform' && result.normedStepValue >= 0 && result.normedStepValue <= 1) {
    slider2.value = result.normedStepValue.toFixed(3);
    readout2.textContent = `Morph: ${(result.normedStepValue * 100 + 0.4).toFixed(0)}%`;
  }
}

function updateSlidersMöbius(result: VisualizationContextUIDisplayResult, source: VisualizationContextUpdateUISource): void {
  if (source === 'reorder' && result.normedStepValue <= 1) {
    slider3.value = result.normedStepValue.toFixed(3);
    readout3.textContent = `Step ${result.stepValue}: ${result.description}`;
  }
  if (source === 'transform' && result.normedStepValue >= 0 && result.normedStepValue <= 1) {
    slider4.value = result.normedStepValue.toFixed(3);
    readout4.textContent = `Morph: ${(result.normedStepValue * 100 + 0.4).toFixed(0)}%`;
  }
}

//--- scene ---

const stepper = setupStepper();

const canvas = document.getElementById('viz') as HTMLCanvasElement;
const renderer = createRenderer(canvas);
const camera = createCamera();
camera.position.set(0, 3, -7);
const surfaceScene = new SurfaceScene(updateSlidersSphere, updateSlidersTorus, updateSlidersMöbius);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

addDefaultLights(surfaceScene.scene);

let lastStep = stepper.getStep();
surfaceScene.applyStep(lastStep);

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

function tick(t: number): void {
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;
    controls.target.set(0, 0, 0);
    surfaceScene.applyStep(cur);

    switch (cur) {
      case 0:
        controls.object.position.set(0, 3, -7);
        break;
      case 1:
        controls.object.position.set(2, 7, 8);
        break;
      case 2:
        controls.object.position.set(2, 3, 6);
        break;
    }
  }

  controls.update();
  surfaceScene.update(t);

  renderer.render(surfaceScene.scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
