import { SceneBase } from '../scene-base';

export abstract class IntroSceneBase extends SceneBase {
  constructor(
    canvasElement: HTMLCanvasElement,
    protected automaticAnimation: boolean
  ) {
    super(canvasElement);
  }

  public hasAutomaticAnimation(): boolean {
    return this.automaticAnimation;
  }

  public override update(t: number, source?: 'manual' | 'automatic'): void {
    super.update(t);
  }
}
