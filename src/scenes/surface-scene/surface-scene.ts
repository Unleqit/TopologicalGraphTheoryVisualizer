import { SurfaceSceneSphere } from './surface-scene-sphere';
import { SurfaceSceneTorus } from './surface-scene-torus';
import { SurfaceSceneMöbius } from './surface-scene-möbius';
import { VisualizationContextUpdateUISource } from './visualization/types/visualization-context-ui-update-source';
import { Scene } from 'three';

export class SurfaceScene {
  readonly scene = new Scene();
  private sphereScene;
  private torusScene;
  private möbiusScene;
  private currentStep = 0;

  constructor(
    updateUIFunctionSphere: (value: number, source: VisualizationContextUpdateUISource) => void,
    updateUIFunctionTorus: (value: number, source: VisualizationContextUpdateUISource) => void,
    updateUIFunctionMöbius: (value: number, source: VisualizationContextUpdateUISource) => void
  ) {
    this.sphereScene = new SurfaceSceneSphere(this.scene, updateUIFunctionSphere);
    this.torusScene = new SurfaceSceneTorus(this.scene, updateUIFunctionTorus);
    this.möbiusScene = new SurfaceSceneMöbius(this.scene, updateUIFunctionMöbius);
  }

  applyStep(step: number): void {
    if (step !== this.currentStep) {
      this.currentStep = step;
    }

    this.sphereScene.setVisible(step === 0);
    this.torusScene.setVisible(step === 1);
    this.möbiusScene.setVisible(step === 2);
  }

  update(time: number): void {
    switch (this.currentStep) {
      case 0:
        this.sphereScene.autoUpdate(time);
        break;
      case 1:
        this.torusScene.autoUpdate(time);
        break;
      case 2:
        this.möbiusScene.autoUpdate(time);
        break;
    }
  }

  onSlider1Change(t: number, t2: number): void {
    switch (this.currentStep) {
      case 0:
        this.sphereScene.updateGraphEmbedding(t, false);
        this.sphereScene.updateShape(t2, false);
        break;
      case 1:
        this.torusScene.updateGraphEmbedding(t, false);
        this.torusScene.updateShape(t2, false);
        break;
      case 2:
        this.möbiusScene.updateGraphEmbedding(t, false);
        this.möbiusScene.updateShape(t2, false);
        break;
    }
  }

  onSlider2Change(t: number): void {
    switch (this.currentStep) {
      case 0:
        this.sphereScene.updateShape(t, false);
        break;
      case 1:
        this.torusScene.updateShape(t, false);
        break;
      case 2:
        this.möbiusScene.updateShape(t, false);
        break;
    }
  }
}
