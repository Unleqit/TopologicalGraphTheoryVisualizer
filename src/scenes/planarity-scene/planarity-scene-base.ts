import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Raycaster,
  AmbientLight,
  DirectionalLight,
  Vector3,
  Vector2,
  Group,
  Intersection,
  Object3D,
  Object3DEventMap,
  Plane,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera, createRenderer } from '../../pages/utils';

export class PlanaritySceneBase {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private webglRenderer: WebGLRenderer;
  private raycaster: Raycaster;

  constructor(canvasElement: HTMLCanvasElement) {
    this.scene = new Scene();
    this.camera = createCamera();
    this.controls = new OrbitControls(this.camera, canvasElement);
    this.controls.enableZoom = true;
    this.controls.enableRotate = false;
    this.webglRenderer = createRenderer(canvasElement);
    this.raycaster = new Raycaster();
    this.raycaster.params.Line.threshold = 0.3;

    this.scene.add(new AmbientLight(0xffffff, 0.6));
    const dir = new DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 4, 5);
    this.scene.add(dir);
  }

  public addToScene(...objects: Object3D[]): void {
    this.scene.add(...objects);
  }

  public removeFromScene(...objects: Object3D[]): void {
    this.scene.remove(...objects);
  }

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public getWebGLRenderer(): WebGLRenderer {
    return this.webglRenderer;
  }

  public setCameraPosition(pos: Vector3): void {
    this.camera.position.copy(pos);
  }

  public resize(w: number, h: number): void {
    this.webglRenderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  public updateScene(): void {
    this.controls.update();
    this.webglRenderer.render(this.scene, this.camera);
  }

  public getIntersectionsForGroup(pos: Vector2, objects: Object3D[]): Intersection<Object3D<Object3DEventMap>>[] {
    this.raycaster.setFromCamera(pos, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  public getIntersectionPointInPlane(pos: Vector2, graphGroup: Group): Vector3 | undefined {
    this.raycaster.setFromCamera(pos, this.camera);
    const normal = new Vector3(0, 0, 1).applyQuaternion(graphGroup.quaternion);
    const point = graphGroup.getWorldPosition(new Vector3());
    const plane = new Plane().setFromNormalAndCoplanarPoint(normal, point);

    const vertex = new Vector3();
    if (!this.raycaster.ray.intersectPlane(plane, vertex)) {
      return;
    }
    return vertex;
  }
}
