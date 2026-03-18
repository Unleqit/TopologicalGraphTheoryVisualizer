import * as THREE from 'three';
import { SurfaceSceneSphere } from './surface-scene-sphere';
import { SurfaceSceneMöbius } from './surface-scene-möbius';
import { SurfaceSceneTorus } from './surface-scene-torus';

export class SurfaceScene {
  readonly scene = new THREE.Scene();
  readonly sphereScene = new SurfaceSceneSphere(this.scene);
  readonly torusScene = new SurfaceSceneTorus(this.scene);
  readonly möbiusScene = new SurfaceSceneMöbius(this.scene);
  private stepStartTime = 0;
  private currentStep = 0;

  constructor() {}

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
        this.torusScene.updateSquareCylinderTorusGraphEmbedding(1 + s);
        this.torusScene.updateSquareCylinderTorus(s);
        break;
      case 2:
        this.möbiusScene.updateSquareMöbius(s);
        break;
    }
  }

  onSlider1Change(t: number, t2: number): void {
    switch (this.currentStep) {
      case 1:
        this.torusScene.updateSquareCylinderTorusGraphEmbedding(t * 0.5, false);
        this.torusScene.updateSquareCylinderTorus(t2, false);
        break;
    }
  }

  onSlider2Change(t: number): void {
    switch (this.currentStep) {
      case 1:
        this.torusScene.updateSquareCylinderTorus(t, false);
        break;
    }
  }
}
