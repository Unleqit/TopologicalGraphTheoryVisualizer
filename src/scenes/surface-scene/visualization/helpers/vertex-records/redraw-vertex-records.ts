import { Vector3 } from 'three';
import { SurfaceSceneBase } from '../../../surface-scene-base';

export function redrawVertexRecords(
  context: SurfaceSceneBase,
  coordinateTransformFunction: (u: number, v: number, p: Vector3) => void,
  setVisibility: boolean = false,
  visibility: boolean = true
): void {
  for (const v of context.vertices.values()) {
    const gv = v.data;
    const p = new Vector3();
    coordinateTransformFunction(gv.vertex.x, gv.vertex.y, p);
    v.mesh.position.copy(p);
    if (setVisibility) {
      v.mesh.visible = visibility;
      v.visible = visibility;
    }
  }
}
