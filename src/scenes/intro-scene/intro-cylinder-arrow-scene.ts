import {
  BufferGeometry,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Vector3,
  WireframeGeometry,
} from 'three';
import { IntroSceneBase } from './intro-scene-base';
import { ArrowFactory } from './shared/arrow-factory';
import { Frame } from './shared/frame';

export class IntroCylinderArrowScene extends IntroSceneBase {
  private cylinderGroup: Group;
  private cylinderMesh: Mesh;
  private cylinderWireframe: LineSegments;
  private movingArrow: Group;
  private startArrow: Group;
  private startMarker: Mesh;
  private initialFrame: Frame;
  private R: number = 1.3;
  private r: number = 0.7;
  private segmentsU: number = 80;

  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement, false);

    this.cylinderGroup = new Group();
    const cylinderGeometry = this.buildCylinderGeometry();
    this.cylinderMesh = new Mesh(cylinderGeometry, new MeshStandardMaterial({ vertexColors: true, side: DoubleSide }));
    this.cylinderGroup.add(this.cylinderMesh);
    this.cylinderWireframe = new LineSegments(new WireframeGeometry(cylinderGeometry), new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }));
    this.cylinderGroup.add(this.cylinderWireframe);
    this.movingArrow = ArrowFactory.createArrow(0xffe082);
    this.startArrow = ArrowFactory.createArrow(0xcfd8dc, 0.48);

    this.cylinderGroup.add(this.movingArrow);
    this.cylinderGroup.add(this.startArrow);
    this.startMarker = new Mesh(new SphereGeometry(0.045, 18, 18), new MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 }));
    this.cylinderGroup.add(this.startMarker);
    this.initialFrame = this.frameOnCylinder(0, 0);

    ArrowFactory.placeInFrame(this.startArrow, this.initialFrame);
    this.startMarker.position.copy(this.initialFrame.p);

    this.cylinderGroup.visible = true;
    this.update(0, 'manual');
    super.getScene().add(this.cylinderGroup);
  }

  private cylinderPoint(u: number, v: number): Vector3 {
    const x = this.R * Math.cos(u);
    const y = this.R * Math.sin(u);
    const z = this.r * Math.sin(v);

    return new Vector3(x, y, z);
  }

  private cylinderDu(u: number): Vector3 {
    return new Vector3(-this.R * Math.sin(u), this.R * Math.cos(u), 0);
  }

  private cylinderDv(v: number): Vector3 {
    return new Vector3(0, 0, this.r * Math.cos(v));
  }

  private frameOnCylinder(u: number, v = Math.PI): Frame {
    const p = this.cylinderPoint(u, v);
    const tangent = this.cylinderDu(u).normalize();
    const across = this.cylinderDv(v).normalize();
    const normal = new Vector3().crossVectors(tangent, across).normalize();

    return { p, tangent, across, normal };
  }

  private buildCylinderGeometry(): BufferGeometry {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const red = new Color(0xff6478);
    const blue = new Color(0x5da9ff);
    const white = new Color(0xf6f8ff);

    const segmentsV = 22;
    for (let i = 0; i <= this.segmentsU; i++) {
      const u = (i / this.segmentsU) * Math.PI * 2;

      for (let j = 0; j <= segmentsV; j++) {
        const t = j / segmentsV; // normalized 0..1 along tube
        const v = (t - 0.5) * 2 * this.r; // actual offset along minor radius

        const p = this.cylinderPoint(u, v);
        positions.push(p.x, p.y, p.z);

        let c: Color;

        const stripeWidth = 0.08; // fraction of tube for white line
        if (Math.abs(t - 0.5) < stripeWidth / 2) {
          c = new Color(0xffffff); // white stripe in the middle
        } else {
          // top = red, bottom = blue
          c = t < 0.5 ? blue.clone() : red.clone();
          c.lerp(white, 0.08); // slight desaturation
        }

        colors.push(c.r, c.g, c.b);
      }
    }

    for (let i = 0; i < this.segmentsU; i++) {
      for (let j = 0; j < segmentsV; j++) {
        const a = i * (segmentsV + 1) + j;
        const b = (i + 1) * (segmentsV + 1) + j;
        const c = (i + 1) * (segmentsV + 1) + (j + 1);
        const d = i * (segmentsV + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    return geometry;
  }

  public override update(t: number, source: 'manual' | 'automatic'): void {
    if (source === 'manual') {
      const u = -t * Math.PI * 2;
      const frame = this.frameOnCylinder(u, 0);
      ArrowFactory.placeUpwards(this.movingArrow, frame, this.R);
      super.update(t, source);
    }
  }
}
