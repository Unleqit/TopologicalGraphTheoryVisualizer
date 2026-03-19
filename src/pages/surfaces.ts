import { SurfaceScene } from '../scenes/surface-scene/surface-scene';
import '../styles/base.css';
import { createCamera } from '../threejs/camera';
import { addDefaultLights } from '../threejs/lights';
import { createRenderer } from '../threejs/renderer';
import { setupStepper } from '../ui/setup-stepper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const slider1 = document.getElementById('slider1') as HTMLInputElement;
const slider2 = document.getElementById('slider2') as HTMLInputElement;
const readout1 = document.getElementById('readout1') as HTMLElement;
const readout2 = document.getElementById('readout2') as HTMLElement;

slider1.addEventListener('input', () => {
  const t = Number(slider1.value);
  surfaceScene.onSlider1Change(t, Number.parseFloat(slider2.value));
  readout1.textContent = `Step: ${t.toFixed(0)}`;
});

slider2.addEventListener('input', () => {
  const t = Number(slider2.value);
  surfaceScene.onSlider2Change(t);
  readout2.textContent = `Step: ${t.toFixed(3)}`;
});

const stepper = setupStepper();

const canvas = document.getElementById('viz') as HTMLCanvasElement;
const renderer = createRenderer(canvas);
const camera = createCamera();
camera.position.set(0, 3, -7);
const surfaceScene = new SurfaceScene(updateSliders);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

addDefaultLights(surfaceScene.scene);

function updateSliders(value: number): void {
  const val1 = (value - 1) * 2;
  const val2 = value - 6.5;

  if (val1 <= 7) {
    const val = val1.toFixed(0);
    slider1.value = val;
    readout1.textContent = `Step: ${val}`;
  }
  if (val2 >= 0 && val2 <= 1) {
    const val = val2.toFixed(3);
    slider2.value = val;
    readout2.textContent = `Step: ${val}`;
  }
}

let lastStep = stepper.getStep();
surfaceScene.applyStep(lastStep, 0);

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
    surfaceScene.applyStep(cur, t);

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
