import '../styles/base.css';
import '../styles/styles.css';

import * as THREE from 'three';
import { createCamera, centerGroup } from '../threejs/camera';
import { createRenderer } from '../threejs/renderer';
import { loadDefaultGraph } from '../layout/load-default-graph';
import { renderRawGraph, renderRawGraphStepWise } from '../scenes/graph-scene';
import { createSphere } from '../threejs/shapes/sphere';
import { setupGraphUI, setupTabs } from '../ui/graph-input-card';
import { setupStepper } from '../ui/setup-stepper';

const stepper = setupStepper();
const canvas = document.getElementById('viz') as HTMLCanvasElement;

const renderer = createRenderer(canvas);
const scene = new THREE.Scene();
const camera = createCamera();

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 4, 5);
scene.add(dir);

const sphere = createSphere();
scene.add(sphere);

const graphGroup = new THREE.Group();
scene.add(graphGroup);

// ---------------- UI ----------------
const ui = setupGraphUI({
  graphMatrixInput: document.getElementById('graphMatrix')! as HTMLTextAreaElement,
  graphListInput: document.getElementById('graphList')! as HTMLTextAreaElement,
  loadGraphBtn: document.getElementById('loadGraphBtn')! as HTMLButtonElement,
  statusEl: document.getElementById('graphStatus')!,
  graphGroup,
  sphere,
  camera,
  stepper,
});

const tabs = document.querySelectorAll<HTMLButtonElement>('.tabBtn');
const modes = document.querySelectorAll<HTMLElement>('.graphMode');
setupTabs(tabs, modes, ui.setMode);

// ---------------- Default Graph ----------------
async function initDefaultGraph(): Promise<void> {
  const result = await loadDefaultGraph();

  //skip planarity check, as default graph is static and guaranteed to be planar
  if (!result) {
    return;
  }

  sphere.visible = false;
  graphGroup.visible = true;

  renderRawGraphStepWise(graphGroup, camera, result, 250);
}
initDefaultGraph();

// ---------------- Render Loop ----------------
const sphereCamPos = camera.position.clone();
let lastStep = stepper.getStep();

function applyStep(step: number): void {
  if (step === 0) {
    sphere.visible = true;
    graphGroup.visible = false;
    camera.position.copy(sphereCamPos);
    camera.updateProjectionMatrix();
  } else {
    sphere.visible = false;
    graphGroup.visible = true;
    centerGroup(graphGroup, camera);
  }
}
applyStep(lastStep);

function resize(): void {
  const area = document.querySelector('.canvasArea')!;
  renderer.setSize(area.clientWidth, area.clientHeight, false);
  camera.aspect = area.clientWidth / area.clientHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

function tick(t: number): void {
  const s = t * 0.001;
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;
    applyStep(cur);
  }
  if (sphere.visible) {
    sphere.rotation.y = s * 0.45;
    sphere.rotation.x = s * 0.2;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
