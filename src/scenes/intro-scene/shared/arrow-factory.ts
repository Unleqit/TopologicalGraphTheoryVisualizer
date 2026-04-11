import { Group, Mesh, CylinderGeometry, MeshStandardMaterial, ConeGeometry, Quaternion, Vector3, Vector2 } from 'three';
import { Frame } from './frame';

export class ArrowFactory {
  public static createArrow(color: number, opacity = 1): Group {
    const arrowGroup = new Group();
    const head = new Mesh(new ConeGeometry(0.055, 0.16, 20), new MeshStandardMaterial({ color, transparent: opacity < 1, opacity }));
    const shaft = new Mesh(new CylinderGeometry(0.018, 0.018, 0.5, 16), new MeshStandardMaterial({ color, transparent: opacity < 1, opacity }));

    shaft.position.y = 0.25;
    arrowGroup.add(shaft);

    head.position.y = 0.58;
    arrowGroup.add(head);

    return arrowGroup;
  }

  public static placeInFrame(arrow: Group, frame: Frame): void {
    arrow.position.copy(frame.p);
    const yAxis = new Vector3(0, 1, 0);
    const q = new Quaternion().setFromUnitVectors(yAxis, frame.across);
    arrow.quaternion.copy(q);
  }

  public static placeUpwards(arrow: Group, frame: Frame, R: number): void {
    const xy = new Vector2(frame.p.x, frame.p.y);
    xy.setLength(R);
    const z = frame.p.z;
    arrow.position.set(xy.x, xy.y, z);
    arrow.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(0, 0, 1));
  }
}
