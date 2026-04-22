import { Scene, PerspectiveCamera, WebGLRenderer, Raycaster, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { addDefaultLights, createCamera, createRenderer } from '../pages/utils';
import { IScene } from './iscene';

export abstract class SceneBase implements IScene {
  public readonly scene: Scene = new Scene();
  protected camera: PerspectiveCamera;
  protected controls: OrbitControls;
  protected webglRenderer: WebGLRenderer;
  protected raycaster: Raycaster;
  protected animationId: number | undefined;
  protected startTime: number = -1;
  protected pausedAt: number = 0;

  constructor(canvasElement: HTMLCanvasElement) {
    this.scene = new Scene();
    this.camera = createCamera();
    this.controls = new OrbitControls(this.camera, canvasElement);
    this.controls.enableZoom = true;
    this.webglRenderer = createRenderer(canvasElement);
    this.raycaster = new Raycaster();
    this.raycaster.params.Line.threshold = 0.3;
    addDefaultLights(this.scene);
  }
  getScene(): Scene {
    return this.scene;
  }

  public resize(w: number, h: number): void {
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.webglRenderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  public startAnimation(startPosition?: Vector3): void {
    if (this.animationId) {
      return;
    }

    const now = performance.now() * 0.001;
    if (this.startTime >= 0) {
      this.startTime += now - this.pausedAt;
    }

    this.setVisible(true);
    this.controls.target.set(0, 0, 0);
    if (startPosition) {
      this.controls.object.position.copy(startPosition);
    }
    this.animationId = requestAnimationFrame(this._update.bind(this));
  }

  public stopAnimation(): Vector3 {
    if (!this.animationId) {
      return this.controls.object.position;
    }

    cancelAnimationFrame(this.animationId);
    this.setVisible(false);
    this.pausedAt = performance.now() * 0.001;
    this.animationId = undefined;

    return this.controls.object.position;
  }

  private _update(t: number): void {
    this.controls.update();
    this.update(t * 0.001);
    this.webglRenderer.render(this.scene, this.camera);
    this.animationId = requestAnimationFrame(this._update.bind(this));
  }

  protected update(t: number): void {}

  public setVisible(visible: boolean): void {
    this.scene.visible = visible;
  }
}
