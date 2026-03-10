import '../styles/base.css';
import { IntroScene } from '../scenes/intro-scene';
import { createCamera } from '../threejs/camera';
import { addDefaultLights } from '../threejs/lights';
import { createRenderer } from '../threejs/renderer';
import { setupStepper } from '../ui/setup-stepper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stepper = setupStepper();

const canvas = document.getElementById('viz') as HTMLCanvasElement;

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

function tick(t: number): void {
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;
    introScene.applyStep(cur);
  }

  introScene.update(t);
  controls.update();

  renderer.render(introScene.scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
