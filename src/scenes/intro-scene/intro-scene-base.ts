import { Object3D, Scene } from 'three';
import { addDefaultLights } from '../../pages/utils';

export abstract class IntroSceneBase {
  protected readonly scene = new Scene();

  constructor(protected automaticAnimation: boolean) {
    addDefaultLights(this.scene);
  }

  public add(obj: Object3D): void {
    this.scene.add(obj);
  }

  public getScene(): Scene {
    return this.scene;
  }

  public setVisible(visible: boolean): void {
    this.scene.visible = visible;
  }

  public hasAutomaticAnimation(): boolean {
    return this.automaticAnimation;
  }

  public abstract update(t?: number): void;
}
