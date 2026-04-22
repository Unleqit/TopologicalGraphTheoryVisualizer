import {
  Mesh,
  Group,
  LineSegments,
  BufferGeometry,
  DoubleSide,
  Line,
  LineBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
  WireframeGeometry,
  Color,
  Float32BufferAttribute,
} from 'three';
import { IntroSceneBase } from './intro-scene-base';
import { Frame } from './shared/frame';
import { ArrowFactory } from './shared/arrow-factory';

export class IntroMöbiusArrowScene extends IntroSceneBase {
  private mobiusGroup: Group;
  private mobiusMesh: Mesh;
  private mobiusWire: LineSegments;
  private mobiusArrow: Group;
  private mobiusStartArrow: Group;
  private mobiusMarker: Mesh;
  private mobiusInitialFrame: Frame;

  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement, false);
    this.mobiusGroup = new Group();
    const mobiusGeometry = this.buildMobiusGeometry();
    const mobiusMaterial = new MeshStandardMaterial({ vertexColors: true, side: DoubleSide, roughness: 0.45, metalness: 0.04 });

    this.mobiusMesh = new Mesh(mobiusGeometry, mobiusMaterial);
    this.mobiusGroup.add(this.mobiusMesh);
    this.mobiusWire = new LineSegments(new WireframeGeometry(mobiusGeometry), new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }));
    this.mobiusGroup.add(this.mobiusWire);

    const centerPoints: Vector3[] = [];
    for (let i = 0; i <= 420; i++) {
      const u = (i / 420) * Math.PI * 2;
      centerPoints.push(this.mobiusPoint(u, 0));
    }
    const centerLine = new Line(new BufferGeometry().setFromPoints(centerPoints), new LineBasicMaterial({ color: 0xffffff }));
    this.mobiusGroup.add(centerLine);
    this.mobiusArrow = ArrowFactory.createArrow(0xffe082);
    this.mobiusStartArrow = ArrowFactory.createArrow(0xcfd8dc, 0.45);
    this.mobiusGroup.add(this.mobiusArrow);
    this.mobiusGroup.add(this.mobiusStartArrow);

    this.mobiusMarker = new Mesh(new SphereGeometry(0.045, 18, 18), new MeshStandardMaterial({ color: 0xffffff }));
    this.mobiusGroup.add(this.mobiusMarker);
    this.mobiusInitialFrame = this.frameOnMobius(0, 0);
    ArrowFactory.placeInFrame(this.mobiusStartArrow, this.mobiusInitialFrame);

    this.mobiusArrow.position.copy(this.mobiusStartArrow.position);
    this.mobiusArrow.quaternion.copy(this.mobiusStartArrow.quaternion);
    this.mobiusMarker.position.copy(this.mobiusInitialFrame.p);
    this.mobiusGroup.visible = true;
    super.getScene().add(this.mobiusGroup);
  }

  private mobiusPoint(u: number, v: number, radius = 1.3): Vector3 {
    const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
    const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
    const z = v * Math.sin(u / 2);
    return new Vector3(x, z, y);
  }

  private mobiusDu(u: number, v: number, radius = 1.3): Vector3 {
    const A = radius + v * Math.cos(u / 2);
    const dA = -0.5 * v * Math.sin(u / 2);

    const dx = dA * Math.cos(u) - A * Math.sin(u);
    const dy = dA * Math.sin(u) + A * Math.cos(u);
    const dz = 0.5 * v * Math.cos(u / 2);

    return new Vector3(dx, dz, dy);
  }

  private mobiusDv(u: number): Vector3 {
    const dx = Math.cos(u / 2) * Math.cos(u);
    const dy = Math.cos(u / 2) * Math.sin(u);
    const dz = Math.sin(u / 2);

    return new Vector3(dx, dz, dy);
  }

  private frameOnMobius(u: number, v = 0): Frame {
    const p = this.mobiusPoint(u, v);
    const tangent = this.mobiusDu(u, v).normalize();
    const across = this.mobiusDv(u).normalize();
    const normal = new Vector3().crossVectors(tangent, across).normalize();
    return { p, tangent, across, normal };
  }

  private buildMobiusGeometry(segmentsU = 240, segmentsV = 28, width = 0.35): BufferGeometry {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const red = new Color(0xff6478);
    const blue = new Color(0x5da9ff);
    const white = new Color(0xffffff);

    for (let i = 0; i <= segmentsU; i++) {
      const u = (i / segmentsU) * Math.PI * 2;

      for (let j = 0; j <= segmentsV; j++) {
        const t = j / segmentsV;
        const v = (t - 0.5) * 2 * width;

        const p = this.mobiusPoint(u, v);
        positions.push(p.x, p.y, p.z);

        const c = v < 0 ? blue.clone() : red.clone();
        c.lerp(white, 0.08);

        colors.push(c.r, c.g, c.b);
      }
    }

    for (let i = 0; i < segmentsU; i++) {
      for (let j = 0; j < segmentsV; j++) {
        const a = i * (segmentsV + 1) + j;
        const b = (i + 1) * (segmentsV + 1) + j;
        const c = (i + 1) * (segmentsV + 1) + (j + 1);
        const d = i * (segmentsV + 1) + (j + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const g = new BufferGeometry();
    g.setIndex(indices);
    g.setAttribute('position', new Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();

    return g;
  }

  public override update(t: number, source: 'manual' | 'automatic'): void {
    if (source === 'manual') {
      const u = t * Math.PI * 2;
      const frame = this.frameOnMobius(u, 0);
      ArrowFactory.placeInFrame(this.mobiusArrow, frame);
      super.update(t);
    }
  }
}
