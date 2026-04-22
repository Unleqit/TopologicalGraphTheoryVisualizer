import { PerspectiveCamera, WebGLRenderer, Vector3, Vector2, Group, Intersection, Object3D, Object3DEventMap, Plane } from 'three';
import { SceneBase } from '../scene-base';

export class PlanaritySceneBase extends SceneBase {
  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement);
    this.controls.enableRotate = false;
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
