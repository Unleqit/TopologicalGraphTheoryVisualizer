import {
  Mesh,
  Group,
  Vector3,
  Line,
  BufferGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  DoubleSide,
  LineBasicMaterial,
  MeshPhongMaterial,
  MathUtils,
  MeshBasicMaterial,
  CatmullRomCurve3,
  TubeGeometry,
} from 'three';
import { IntroSceneBase } from './intro-scene-base';

export class IntroSphereHandleScene extends IntroSceneBase {
  // --- sphere graph ---
  private sphereGraphGroup: Group;
  private graphSphere!: Mesh;
  private V!: Record<string, Vector3>;
  private acLine!: Line;
  private acLineOriginal!: Line;
  private crossMarker!: Mesh;
  private handleCurve!: Vector3[];
  private handleMesh!: Mesh;
  private handleAdded = false;
  private handleMorph = 0; // 0..1
  private handleMorphSpeed = 0.015;
  private morphingHandle = false;

  //sphere morphing

  constructor(canvasElement: HTMLCanvasElement) {
    super(canvasElement, false);
    this.sphereGraphGroup = new Group();
    this.sphereGraphGroup.visible = true;

    const sphereRadius = 2;
    const sphereMaterial = new MeshPhongMaterial({ color: 0x5fa8ff, side: DoubleSide });
    this.graphSphere = new Mesh(new SphereGeometry(sphereRadius, 64, 64), sphereMaterial);
    this.sphereGraphGroup.add(this.graphSphere);

    this.V = { A: this.latLon(35, -35, sphereRadius), B: this.latLon(35, 35, sphereRadius), C: this.latLon(-35, 35, sphereRadius), D: this.latLon(-35, -35, sphereRadius) };
    const ac = this.surfaceCurve(this.V.A, this.V.C, sphereRadius);
    const bd = this.surfaceCurve(this.V.B, this.V.D, sphereRadius);

    this.addEdge(this.surfaceCurve(this.V.A, this.V.B, sphereRadius), 0x90ee90);
    this.addEdge(this.surfaceCurve(this.V.B, this.V.C, sphereRadius), 0x90ee90);
    this.addEdge(this.surfaceCurve(this.V.C, this.V.D, sphereRadius), 0x90ee90);
    this.addEdge(this.surfaceCurve(this.V.D, this.V.A, sphereRadius), 0x90ee90);
    this.addEdge(bd, 0x90ee90);
    this.acLine = this.addEdge(ac, 0xff6666);
    this.acLineOriginal = this.acLine.clone();

    const crossPos = this.crossing(ac, bd, sphereRadius);
    this.crossMarker = new Mesh(new SphereGeometry(0.05, 16, 16), new MeshBasicMaterial({ color: 0xffffff }));
    this.crossMarker.position.copy(crossPos);
    this.sphereGraphGroup.add(this.crossMarker);

    Object.values(this.V).forEach((v) => this.addVertex(v));
    super.getScene().add(this.sphereGraphGroup);
  }

  private latLon(lat: number, lon: number, radius: number): Vector3 {
    lat = MathUtils.degToRad(lat);
    lon = MathUtils.degToRad(lon);

    return new Vector3(radius * Math.cos(lat) * Math.sin(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.cos(lon));
  }

  private surfaceCurve(a: Vector3, b: Vector3, radius: number, segments = 200): Vector3[] {
    const pts: Vector3[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;

      const p = a
        .clone()
        .multiplyScalar(1 - t)
        .add(b.clone().multiplyScalar(t));

      p.normalize().multiplyScalar(radius * 1.001);
      pts.push(p);
    }

    return pts;
  }

  private addEdge(points: Vector3[], color: number): Line {
    const geo = new BufferGeometry().setFromPoints(points);
    const line = new Line(geo, new LineBasicMaterial({ color }));

    this.sphereGraphGroup.add(line);
    return line;
  }

  private addVertex(p: Vector3): void {
    const mesh = new Mesh(new SphereGeometry(0.07, 20, 20), new MeshStandardMaterial({ color: 0xffcc66 }));

    mesh.position.copy(p.clone().multiplyScalar(1.01));
    this.sphereGraphGroup.add(mesh);
  }

  private crossing(p1: Vector3[], p2: Vector3[], radius: number): Vector3 {
    let best!: Vector3;
    let min = Infinity;

    for (const a of p1) {
      for (const b of p2) {
        const d = a.distanceToSquared(b);

        if (d < min) {
          min = d;
          best = a.clone().add(b).multiplyScalar(0.5);
        }
      }
    }

    return best.normalize().multiplyScalar(radius * 1.01);
  }

  private buildMugHandleCurve(start: Vector3, end: Vector3): Vector3[] {
    const sphereRadius = 2;

    const a = start.clone().normalize();
    const c = end.clone().normalize();

    const mid = a.clone().add(c).normalize();

    let plane = new Vector3().crossVectors(a, c);
    if (plane.lengthSq() < 1e-10) {
      plane = new Vector3(0, 1, 0);
    }

    plane.normalize();

    const side = new Vector3().crossVectors(plane, mid).normalize();

    const lift = 0.35;
    const flare = 0.05;

    const p0 = start.clone();

    const p1 = start.clone().multiplyScalar(1.04).add(mid.clone().multiplyScalar(0.05)).add(side.clone().multiplyScalar(-flare));

    const p2 = mid.clone().multiplyScalar(sphereRadius + lift);

    const p3 = end.clone().multiplyScalar(1.04).add(mid.clone().multiplyScalar(0.05)).add(side.clone().multiplyScalar(flare));

    const p4 = end.clone();

    const curve = new CatmullRomCurve3([p0, p1, p2, p3, p4]);
    curve.curveType = 'centripetal';
    curve.tension = 0.35;

    return curve.getPoints(260);
  }

  private useHandle(): void {
    this.sphereGraphGroup.remove(this.acLine);
    this.sphereGraphGroup.remove(this.crossMarker);

    const geo = new BufferGeometry().setFromPoints(this.handleCurve);
    this.acLine = new Line(geo, new LineBasicMaterial({ color: 0xff6666 }));

    this.sphereGraphGroup.add(this.acLine);
  }

  public override update(t: number, source: 'manual' | 'automatic'): void {
    if (source === 'manual') {
      if (this.morphingHandle) {
        this.updateHandleMorph();
      }
    }
  }

  private startHandleMorph(): void {
    this.handleCurve = this.buildMugHandleCurve(this.V.A, this.V.C);
    const curve = new CatmullRomCurve3(this.handleCurve);
    const material = new MeshPhongMaterial({ color: 0x5fa8ff, transparent: true, opacity: 0.35, side: DoubleSide });
    this.handleMesh = new Mesh(new TubeGeometry(curve, 260, 0.001, 18, false), material);
    this.sphereGraphGroup.add(this.handleMesh);
    this.handleMorph = 0;
    this.morphingHandle = true;
  }

  private updateHandleMorph(): void {
    this.handleMorph += this.handleMorphSpeed;
    const r = 0.001 + 0.09 * this.handleMorph;
    const curve = new CatmullRomCurve3(this.handleCurve);
    this.handleMesh.geometry.dispose();
    this.handleMesh.geometry = new TubeGeometry(curve, 260, r, 18, false);
    if (this.handleMorph >= 1) {
      this.morphingHandle = false;
    }
  }

  public isHandleAdded(): boolean {
    return this.handleAdded;
  }

  public startHandleMorphManual(): void {
    this.startHandleMorph();
    const checkMorphEnd = (): void => {
      this.updateHandleMorph();
      if (!this.morphingHandle) {
        this.useHandle(); // route red line through handle
        this.handleAdded = true;
      } else {
        requestAnimationFrame(checkMorphEnd);
      }
    };
    requestAnimationFrame(checkMorphEnd);
  }

  public resetHandle(): void {
    if (!this.handleMesh) {
      return;
    }

    // Animate shrinking of the handle
    this.morphingHandle = true;
    const shrinkSpeed = 0.03; // adjust speed as desired

    const shrinkStep = (): void => {
      this.handleMorph -= shrinkSpeed;

      if (this.handleMorph <= 0) {
        this.handleMorph = 0;
        this.morphingHandle = false;

        // remove handle mesh
        this.sphereGraphGroup.remove(this.handleMesh);
        this.handleMesh.geometry.dispose();
        this.handleMesh = undefined as any;

        // restore original crossing line
        if (this.acLine !== this.acLineOriginal) {
          this.sphereGraphGroup.remove(this.acLine);
          this.acLine = this.acLineOriginal.clone();
          this.sphereGraphGroup.add(this.acLine);
        }

        // restore cross marker
        if (!this.sphereGraphGroup.children.includes(this.crossMarker)) {
          this.sphereGraphGroup.add(this.crossMarker);
        }

        this.handleAdded = false;
      } else {
        // shrink the handle gradually
        const curve = new CatmullRomCurve3(this.handleCurve);
        const r = 0.001 + 0.09 * this.handleMorph;
        this.handleMesh.geometry.dispose();
        this.handleMesh.geometry = new TubeGeometry(curve, 260, r, 18, false);

        requestAnimationFrame(shrinkStep);
      }
    };

    shrinkStep();
  }
}
