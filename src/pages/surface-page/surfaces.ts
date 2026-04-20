import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera, createRenderer } from '../utils';
import { VisualizationContextUpdateUISource } from '../../scenes/surface-scene/visualization/types/visualization-context-ui-update-source';
import { VisualizationContextUIDisplayResult } from '../../scenes/surface-scene/visualization/types/visualization-context-ui-display-result';
import { Stepper } from '../../ui/setup-stepper';
import { SurfaceSceneBase } from '../../scenes/surface-scene/surface-scene-base';
import { SurfaceSceneMöbius } from '../../scenes/surface-scene/surface-scene-möbius';
import { SurfaceSceneSphere } from '../../scenes/surface-scene/surface-scene-sphere';
import { SurfaceSceneTorus } from '../../scenes/surface-scene/surface-scene-torus';
import { PerspectiveCamera, Vector3, WebGLRenderer } from 'three';

//--- sphere ---
export class SurfacePage {
  private controlMap: Map<number, HTMLInputElement[]>;
  private stepper = new Stepper();
  private lastStep = -1;
  private renderer: WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private camera: PerspectiveCamera;
  private surfaceScenes: SurfaceSceneBase[];
  private startPositions: Vector3[];
  private controls: OrbitControls;

  constructor() {
    this.lastStep = this.stepper.getStep();

    const slider_1 = document.getElementById('slider-1') as HTMLInputElement;
    const slider0 = document.getElementById('slider0') as HTMLInputElement;
    const readout_1 = document.getElementById('readout-1') as HTMLInputElement;
    const readout0 = document.getElementById('readout0') as HTMLInputElement;

    //--- torus ---
    const slider1 = document.getElementById('slider1') as HTMLInputElement;
    const slider2 = document.getElementById('slider2') as HTMLInputElement;
    const readout1 = document.getElementById('readout1') as HTMLInputElement;
    const readout2 = document.getElementById('readout2') as HTMLInputElement;

    //--- möbius ---
    const slider3 = document.getElementById('slider3') as HTMLInputElement;
    const slider4 = document.getElementById('slider4') as HTMLInputElement;
    const readout3 = document.getElementById('readout3') as HTMLInputElement;
    const readout4 = document.getElementById('readout4') as HTMLInputElement;

    this.controlMap = new Map([
      [0, [slider_1, slider0, readout_1, readout0]],
      [1, [slider1, slider2, readout1, readout2]],
      [2, [slider3, slider4, readout3, readout4]],
    ]);

    this.canvas = document.getElementById('viz') as HTMLCanvasElement;
    this.renderer = createRenderer(this.canvas);
    this.camera = createCamera();
    this.camera.position.set(0, 3, -7);
    this.surfaceScenes = [new SurfaceSceneSphere(this.updateUI.bind(this)), new SurfaceSceneTorus(this.updateUI.bind(this)), new SurfaceSceneMöbius(this.updateUI.bind(this))];
    this.startPositions = [new Vector3(0, 3, -7), new Vector3(2, 7, 8), new Vector3(2, 3, 6)];
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    window.addEventListener('resize', this.resize);
    this.resize();

    slider_1.addEventListener('input', () => {
      const t = Number(slider_1.value);
      this.surfaceScenes[this.stepper.getStep()].updateGraphEmbedding(t, false);
      this.surfaceScenes[this.stepper.getStep()].updateShape(Number.parseFloat(slider0.value), false);
    });

    slider0.addEventListener('input', () => {
      const t = Number(slider0.value);
      this.surfaceScenes[this.stepper.getStep()].updateShape(t, false);
      readout0.textContent = `Morph: ${(t * 100 + 0.4).toFixed(0)}%`;
    });

    slider1.addEventListener('input', () => {
      const t = Number(slider1.value);
      this.surfaceScenes[this.stepper.getStep()].updateGraphEmbedding(t, false);
      this.surfaceScenes[this.stepper.getStep()].updateShape(Number.parseFloat(slider2.value), false);
    });

    slider2.addEventListener('input', () => {
      const t = Number(slider2.value);
      this.surfaceScenes[this.stepper.getStep()].updateShape(t, false);
      readout2.textContent = `Morph: ${(t * 100 + 0.4).toFixed(0)}%`;
    });

    slider3.addEventListener('input', () => {
      const t = Number(slider3.value);
      this.surfaceScenes[this.stepper.getStep()].updateGraphEmbedding(t, false);
      this.surfaceScenes[this.stepper.getStep()].updateShape(Number.parseFloat(slider4.value), false);
    });

    slider4.addEventListener('input', () => {
      const t = Number(slider4.value);
      this.surfaceScenes[this.stepper.getStep()].updateShape(t, false);
      readout4.textContent = `Morph: ${(t * 100 + 0.4).toFixed(0)}`;
    });

    requestAnimationFrame(this.tick.bind(this));
  }

  private updateUI(result: VisualizationContextUIDisplayResult, source: VisualizationContextUpdateUISource): void {
    const controls = this.controlMap.get(this.lastStep);
    if (!controls) {
      return;
    }
    if (source === 'reorder' && result.normedStepValue <= 1) {
      controls[0].value = result.normedStepValue.toFixed(3);
      controls[2].textContent = `Step ${result.stepValue}: ${result.description}`;
    }
    if (source === 'transform' && result.normedStepValue >= 0 && result.normedStepValue <= 1) {
      controls[1].value = result.normedStepValue.toFixed(3);
      controls[3].textContent = `Morph: ${(result.normedStepValue * 100 + 0.4).toFixed(0)}%`;
    }
  }

  //--- scene ---

  private resize(): void {
    const area = document.querySelector('.canvasArea') as HTMLElement;
    if (!area) {
      return;
    }

    const w = area.clientWidth;
    const h = area.clientHeight;

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private tick(t: number): void {
    const cur = this.stepper.getStep();
    if (cur !== this.lastStep) {
      this.lastStep = cur;
      this.controls.target.set(0, 0, 0);
      this.controls.object.position.copy(this.startPositions[cur]);
      this.surfaceScenes.forEach((scene, i) => scene.setVisible(cur === i));
    }

    this.controls.update();
    this.surfaceScenes[cur].autoUpdate(t);
    this.renderer.render(this.surfaceScenes[cur].getScene(), this.camera);
    requestAnimationFrame(this.tick.bind(this));
  }
}
new SurfacePage();
