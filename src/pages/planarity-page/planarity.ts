import '../../styles/themes/base.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadDefaultGraph } from '../../graph/layout/load-default-graph';
import { renderRawGraphStepWise } from '../../scenes/graph-scene/graph-scene';
import { setupGraphUI, setupTabs } from '../../ui/graph-input-card';
import { setupStepper } from '../../ui/setup-stepper';
import { createRenderer, createCamera } from '../utils';
import { AmbientLight, DirectionalLight, Group, Scene } from 'three';

const stepper = setupStepper();
const canvas = document.getElementById('viz') as HTMLCanvasElement;

const renderer = createRenderer(canvas);
const scene = new Scene();
const camera = createCamera();

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enableRotate = false;

scene.add(new AmbientLight(0xffffff, 0.6));
const dir = new DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 4, 5);
scene.add(dir);

const graphGroup = new Group();
scene.add(graphGroup);

// ---------------- UI ----------------
const ui = setupGraphUI({
  graphMatrixInput: document.getElementById('graphMatrix')! as HTMLTextAreaElement,
  graphListInput: document.getElementById('graphList')! as HTMLTextAreaElement,
  loadGraphBtn: document.getElementById('loadGraphBtn')! as HTMLButtonElement,
  statusEl: document.getElementById('graphStatus')!,
  graphGroup,
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

  graphGroup.visible = true;

  renderRawGraphStepWise(graphGroup, camera, result, 250);
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
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
