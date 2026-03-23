import { SurfaceSceneSphere } from './surface-scene-sphere';
import { SurfaceSceneTorus } from './surface-scene-torus';
import { SurfaceSceneMöbius } from './surface-scene-möbius';
import { Scene } from 'three';
import { ISurfaceScene } from './isurface-scene';
import { UpdateUIFunction } from './visualization/types/update-ui-function';

export class SurfaceScene {
  readonly scene = new Scene();
  private scenes: ISurfaceScene[];
  private currentStep = 0;

  constructor(updateUIFunctionSphere: UpdateUIFunction, updateUIFunctionTorus: UpdateUIFunction, updateUIFunctionMöbius: UpdateUIFunction) {
    this.scenes = [
      new SurfaceSceneSphere(this.scene, updateUIFunctionSphere),
      new SurfaceSceneTorus(this.scene, updateUIFunctionTorus),
      new SurfaceSceneMöbius(this.scene, updateUIFunctionMöbius),
    ];
  }

  applyStep(step: number): void {
    if (step !== this.currentStep) {
      this.currentStep = step;
    }

    this.scenes.forEach((scene, i) => scene.setVisible(step === i));
  }

  update(time: number): void {
    this.scenes[this.currentStep].autoUpdate(time);
  }

  onSlider1Change(t: number, t2: number): void {
    this.scenes[this.currentStep].updateGraphEmbedding(t, false);
    this.onSlider2Change(t2);
  }

  onSlider2Change(t: number): void {
    this.scenes[this.currentStep].updateShape(t, false);
  }
}
