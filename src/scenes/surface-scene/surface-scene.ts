import * as THREE from 'three';
import { SurfaceSceneSphere } from './surface-scene-sphere';
import { SurfaceSceneTorus } from './surface-scene-torus';
import { SurfaceSceneMöbius } from './surface-scene-möbius';

export class SurfaceScene {
  readonly scene = new THREE.Scene();
  readonly sphereScene = new SurfaceSceneSphere(this.scene);
  private torusScene;
  private möbiusScene;
  private stepStartTime = 0;
  private currentStep = 0;

  constructor(updateUIFunctionTorus: (value: number) => void, updateUIFunctionMöbius: (value: number) => void) {
    this.torusScene = new SurfaceSceneTorus(this.scene, updateUIFunctionTorus);
    this.möbiusScene = new SurfaceSceneMöbius(this.scene, updateUIFunctionMöbius);
  }

  applyStep(step: number, time: number): void {
    if (step !== this.currentStep) {
      this.currentStep = step;
      this.stepStartTime = time;
    }

    this.sphereScene.setVisible(step === 0);
    this.torusScene.setVisible(step === 1);
    this.möbiusScene.setVisible(step === 2);
  }

  update(time: number): void {
    const s = (time - this.stepStartTime) * 0.001;

    switch (this.currentStep) {
      case 0:
        this.sphereScene.updateSquareCylinderSphere(s);
        break;
      case 1:
        this.torusScene.updateGraphEmbedding(1 + s);
        this.torusScene.updateShape(s);
        break;
      case 2:
        this.möbiusScene.updateGraphEmbedding(1 + s);
        this.möbiusScene.updateShape(s);
        break;
    }
  }

  onSlider1Change(t: number, t2: number): void {
    switch (this.currentStep) {
      case 1:
        this.torusScene.updateGraphEmbedding(t * 0.5, false);
        this.torusScene.updateShape(t2, false);
        break;
      case 2:
        this.möbiusScene.updateGraphEmbedding(t * 0.5, false);
        this.möbiusScene.updateShape(t2, false);
        break;
    }
  }

  onSlider2Change(t: number): void {
    switch (this.currentStep) {
      case 1:
        this.torusScene.updateShape(t, false);
        break;
      case 2:
        this.möbiusScene.updateShape(t, false);
        break;
    }
  }
}
