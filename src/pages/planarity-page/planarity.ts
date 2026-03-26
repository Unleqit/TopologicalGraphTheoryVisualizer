import '../../styles/base.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadDefaultGraph } from '../../graph/layout/load-default-graph';
import { PlanarityScene } from '../../scenes/planarity-scene/planarity-scene';
import { setupGraphUI, setupTabs } from '../../ui/graph-input-card';
import { setupStepper } from '../../ui/setup-stepper';
import { createRenderer, createCamera } from '../utils';

const stepper = setupStepper();
const canvas = document.getElementById('viz') as HTMLCanvasElement;

const renderer = createRenderer(canvas);
const camera = createCamera();
const planarityScene = new PlanarityScene(camera);

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth motion
controls.dampingFactor = 0.05;
controls.zoomSpeed = 1.2;
controls.panSpeed = 1.0;
controls.screenSpacePanning = false; // pan relative to camera
controls.enableRotate = true; // allow rotation
controls.enableZoom = true; // allow zooming

// ---------------- UI ----------------
const ui = setupGraphUI({
  graphMatrixInput: document.getElementById('graphMatrix')! as HTMLTextAreaElement,
  graphListInput: document.getElementById('graphList')! as HTMLTextAreaElement,
  loadGraphBtn: document.getElementById('loadGraphBtn')! as HTMLButtonElement,
  statusEl: document.getElementById('graphStatus')!,
  planarityScene,
  stepper,
});

const graphInputStuff = document.getElementById('graphInputStuff')!;

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

  planarityScene.renderRawGraphStepWise(result, 250);
}
initDefaultGraph();

// ---------------- Render Loop ----------------
let lastStep = stepper.getStep();

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
  }

  //hide the graph input block when it is not needed
  graphInputStuff.style.display = cur === 4 ? 'flex' : 'none';

  planarityScene.applyStep(cur);

  controls.update();
  renderer.render(planarityScene.scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
