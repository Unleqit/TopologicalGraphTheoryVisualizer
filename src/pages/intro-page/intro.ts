import { setupStepper } from '../../ui/setup-stepper';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PerspectiveCamera, Vector3, WebGLRenderer } from 'three';
import { IntroSphereHandleScene } from '../../scenes/intro-scene/intro-sphere-handle-scene';
import { IntroCylinderArrowScene } from '../../scenes/intro-scene/intro-cylinder-arrow-scene';
import { IntroMorphSphereScene } from '../../scenes/intro-scene/intro-morph-sphere-scene';
import { IntroMöbiusArrowScene } from '../../scenes/intro-scene/intro-möbius-arrow-scene';
import { IntroSceneBase } from '../../scenes/intro-scene/intro-scene-base';
import { createCamera, createRenderer } from '../utils';

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
  introScenes[1].update(t);
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
  introScenes[2].update(turns);
  mobiusReadout.textContent = `turns = ${turns.toFixed(3)}`;
});

const handleBtn = document.getElementById('handleBtn') as HTMLButtonElement;

handleBtn.addEventListener('click', () => {
  const scene = introScenes[3] as IntroSphereHandleScene;
  if (!scene.isHandleAdded()) {
    handleBtn.textContent = 'Reset Handle';
    scene.startHandleMorphManual();
  } else {
    handleBtn.textContent = 'Show Handle';
    scene.resetHandle();
  }
});

const renderer: WebGLRenderer = createRenderer(canvas);
const camera: PerspectiveCamera = createCamera();
const introScenes: IntroSceneBase[] = [new IntroMorphSphereScene(), new IntroCylinderArrowScene(), new IntroMöbiusArrowScene(), new IntroSphereHandleScene()];
const startCameraPositions: Vector3[] = [new Vector3(0, 0, 8), new Vector3(-2, -2, 5), new Vector3(2, 4, 4), new Vector3(0, 0, 8)];

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

let lastStep = stepper.getStep();

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

function tick(): void {
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;

    introScenes.forEach((introScene, i) => {
      introScene.setVisible(cur === i);
    });

    controls.object.position.copy(startCameraPositions[cur]);
  }

  controls.update();

  introScenes.forEach((introScene, i) => {
    if (cur === i && introScene.hasAutomaticAnimation()) {
      introScene.update();
    }
  });
  renderer.render(introScenes[cur].getScene(), camera);

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
