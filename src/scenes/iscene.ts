import { Scene, Vector3 } from 'three';

export interface IScene {
  setVisible(visible: boolean): void;
  startAnimation(startPosition: Vector3): void;
  stopAnimation(): void;
  getScene(): Scene;
  resize(w: number, h: number): void;
}
