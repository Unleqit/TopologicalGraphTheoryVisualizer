import { SurfaceScene } from '../scenes/surface-scene';
import '../styles/base.css';
import { createCamera } from '../threejs/camera';
import { addDefaultLights } from '../threejs/lights';
import { createRenderer } from '../threejs/renderer';
import { setupStepper } from '../ui/setup-stepper';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const stepper = setupStepper();

const canvas = document.getElementById('viz') as HTMLCanvasElement;
const renderer = createRenderer(canvas);
const camera = createCamera();
const surfaceScene = new SurfaceScene();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

addDefaultLights(surfaceScene.scene);

surfaceScene;

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
    surfaceScene.applyStep(cur);
  }

  controls.update();
  surfaceScene.update(t);

  renderer.render(surfaceScene.scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

/*

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


*/
