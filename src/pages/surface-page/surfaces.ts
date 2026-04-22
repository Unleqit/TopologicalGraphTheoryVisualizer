import { SurfaceSceneBaseUpdateUISource } from '../../scenes/surface-scene/visualization/types/visualization-context-ui-update-source';
import { SurfaceSceneBaseUIDisplayResult } from '../../scenes/surface-scene/visualization/types/visualization-context-ui-display-result';
import { Stepper } from '../../ui/setup-stepper';
import { SurfaceSceneBase } from '../../scenes/surface-scene/surface-scene-base';
import { SurfaceSceneMöbius } from '../../scenes/surface-scene/surface-scene-möbius';
import { SurfaceSceneSphere } from '../../scenes/surface-scene/surface-scene-sphere';
import { SurfaceSceneTorus } from '../../scenes/surface-scene/surface-scene-torus';
import { Vector3 } from 'three';

//--- sphere ---
export class SurfacePage {
  private controlMap: Map<number, HTMLInputElement[]>;
  private stepper = new Stepper();
  private lastStep = -1;
  private canvas: HTMLCanvasElement;
  private surfaceScenes: SurfaceSceneBase[];
  private startPositions: (Vector3 | undefined)[];

  constructor() {
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
    this.surfaceScenes = [
      new SurfaceSceneSphere(this.canvas, this.updateUI.bind(this)),
      new SurfaceSceneTorus(this.canvas, this.updateUI.bind(this)),
      new SurfaceSceneMöbius(this.canvas, this.updateUI.bind(this)),
    ];
    this.startPositions = [new Vector3(0, 3, -7), new Vector3(2, 7, 8), new Vector3(2, 3, 6)];

    this.lastStep = this.stepper.getStep();
    this.stepper.addEventListener('stepchange', (e) => {
      const step = (e as CustomEvent<number>).detail;
      this.startPositions[this.lastStep] = this.surfaceScenes[this.lastStep].stopAnimation();
      this.surfaceScenes[step].startAnimation(this.startPositions[step]);
      this.lastStep = step;
    });
    this.surfaceScenes[this.lastStep].startAnimation(this.startPositions[this.lastStep]);
    this.startPositions[this.lastStep] = undefined;

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
  }

  private updateUI(result: SurfaceSceneBaseUIDisplayResult, source: SurfaceSceneBaseUpdateUISource): void {
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
    this.surfaceScenes.forEach((scene) => scene.resize(w, h));
  }
}
new SurfacePage();
