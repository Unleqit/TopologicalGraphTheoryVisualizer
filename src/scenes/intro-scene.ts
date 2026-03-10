import * as THREE from 'three';

export class IntroScene {
  readonly scene = new THREE.Scene();
  private objects: THREE.Object3D[] = [];

  private sphere: THREE.Mesh;

  // --- STEP 3: sphere graph ---
  private sphereGraphGroup: THREE.Group;
  private graphSphere!: THREE.Mesh;
  private V!: Record<string, THREE.Vector3>;
  private acLine!: THREE.Line;
  private bdLine!: THREE.Line;
  private crossMarker!: THREE.Mesh;
  private handleCurve!: THREE.Vector3[];
  private handleMesh!: THREE.Mesh;
  private handleAdded = false;
  private handleUsed = false;

  private handleAddTime = 4000; // ms after step start
  private handleUseTime = 7000; // ms after step start
  private sphereStepStart = 0;
  private handleMorph = 0; // 0..1
  private handleMorphSpeed = 0.015;
  private morphingHandle = false;

  // --- Möbius ---
  private mobiusGroup: THREE.Group;
  private mobiusMesh: THREE.Mesh;
  private mobiusWire: THREE.LineSegments;
  private mobiusArrow: THREE.Group;
  private mobiusStartArrow: THREE.Group;
  private mobiusMarker: THREE.Mesh;
  private mobiusInitialFrame: any;

  // --- torus with arrows ---
  private torusGroup: THREE.Group;
  private torusMesh: THREE.Mesh;
  private torusWireframe: THREE.LineSegments;
  private movingArrow: THREE.Group;
  private startArrow: THREE.Group;
  private startMarker: THREE.Mesh;
  private initialFrame: { p: THREE.Vector3; tangent: THREE.Vector3; across: THREE.Vector3; normal: THREE.Vector3 };

  //sphere morphing
  private geometry: THREE.BufferGeometry;
  private basePositions: Float32Array;
  private baseNormals: Float32Array;

  constructor() {
    const baseGeometry = new THREE.SphereGeometry(1.4, 48, 24);
    this.geometry = baseGeometry.clone();
    this.basePositions = (this.geometry.attributes.position.array as Float32Array).slice();
    this.baseNormals = (this.geometry.attributes.normal.array as Float32Array).slice();

    this.sphere = new THREE.Mesh(this.geometry, new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));

    /* ------------------------------------------------ */
    /*                    MOBIUS STRIP                  */
    /* ------------------------------------------------ */

    this.mobiusGroup = new THREE.Group();

    const mobiusGeometry = this.buildMobiusGeometry();

    const mobiusMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.04 });

    this.mobiusMesh = new THREE.Mesh(mobiusGeometry, mobiusMaterial);
    this.mobiusGroup.add(this.mobiusMesh);

    this.mobiusWire = new THREE.LineSegments(new THREE.WireframeGeometry(mobiusGeometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }));

    this.mobiusGroup.add(this.mobiusWire);

    const centerPoints: THREE.Vector3[] = [];

    for (let i = 0; i <= 420; i++) {
      const u = (i / 420) * Math.PI * 2;
      centerPoints.push(this.mobiusPoint(u, 0));
    }

    const centerLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(centerPoints), new THREE.LineBasicMaterial({ color: 0xffffff }));

    this.mobiusGroup.add(centerLine);

    this.mobiusArrow = this.createArrow(0xffe082);
    this.mobiusStartArrow = this.createArrow(0xcfd8dc, 0.45);

    this.mobiusGroup.add(this.mobiusArrow);
    this.mobiusGroup.add(this.mobiusStartArrow);

    this.mobiusMarker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 18), new THREE.MeshStandardMaterial({ color: 0xffffff }));

    this.mobiusGroup.add(this.mobiusMarker);

    this.mobiusInitialFrame = this.frameOnMobius(0, 0);

    this.placeArrow(this.mobiusStartArrow, this.mobiusInitialFrame);
    this.mobiusMarker.position.copy(this.mobiusInitialFrame.p);

    this.mobiusGroup.visible = false;

    /* ------------------------------------------------ */
    /*                     TORUS                        */
    /* ------------------------------------------------ */

    this.torusGroup = new THREE.Group();

    const R = 1.3;
    const r = 0.5;
    const segmentsU = 80;
    const segmentsV = 22;

    function torusPoint(u: number, v: number): THREE.Vector3 {
      const x = (R + r * Math.cos(v)) * Math.cos(u);
      const y = (R + r * Math.cos(v)) * Math.sin(u);
      const z = r * Math.sin(v);
      return new THREE.Vector3(x, y, z);
    }

    function torusDu(u: number, v: number): THREE.Vector3 {
      return new THREE.Vector3(-(R + r * Math.cos(v)) * Math.sin(u), (R + r * Math.cos(v)) * Math.cos(u), 0);
    }

    function torusDv(u: number, v: number): THREE.Vector3 {
      return new THREE.Vector3(-r * Math.sin(v) * Math.cos(u), -r * Math.sin(v) * Math.sin(u), r * Math.cos(v));
    }

    function frameOnTorus(u: number, v = 0) {
      const p = torusPoint(u, v);
      const tangent = torusDu(u, v).normalize();
      const across = torusDv(u, v).normalize();
      const normal = new THREE.Vector3().crossVectors(tangent, across).normalize();
      return { p, tangent, across, normal };
    }

    function buildTorusGeometry(): THREE.BufferGeometry {
      const positions: number[] = [];
      const colors: number[] = [];
      const indices: number[] = [];

      const red = new THREE.Color(0xff6478);
      const blue = new THREE.Color(0x5da9ff);
      const white = new THREE.Color(0xf6f8ff);

      for (let i = 0; i <= segmentsU; i++) {
        const u = (i / segmentsU) * Math.PI * 2;

        for (let j = 0; j <= segmentsV; j++) {
          const v = (j / segmentsV) * Math.PI * 2;

          const p = torusPoint(u, v);
          positions.push(p.x, p.y, p.z);

          let c = v < Math.PI ? blue.clone() : red.clone();
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

      const geometry = new THREE.BufferGeometry();
      geometry.setIndex(indices);
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();

      return geometry;
    }

    const torusGeometry = buildTorusGeometry();

    this.torusMesh = new THREE.Mesh(torusGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide }));

    this.torusGroup.add(this.torusMesh);

    this.torusWireframe = new THREE.LineSegments(new THREE.WireframeGeometry(torusGeometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12 }));

    this.torusGroup.add(this.torusWireframe);

    this.movingArrow = this.createArrow(0xffe082);
    this.startArrow = this.createArrow(0xcfd8dc, 0.48);

    this.torusGroup.add(this.movingArrow);
    this.torusGroup.add(this.startArrow);

    this.startMarker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 18, 18), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333 }));

    this.torusGroup.add(this.startMarker);

    this.initialFrame = frameOnTorus(0, 0);

    this.placeArrow(this.startArrow, this.initialFrame);
    this.startMarker.position.copy(this.initialFrame.p);

    this.torusGroup.visible = false;

    this.sphereGraphGroup = new THREE.Group();
    this.sphereGraphGroup.visible = false;
    this.buildSphereGraphStep();

    this.add(this.sphere);
    this.add(this.mobiusGroup);
    this.add(this.torusGroup);
    this.add(this.sphereGraphGroup);
  }

  private buildSphereGraphStep() {
    const sphereRadius = 2;

    // sphere
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x5fa8ff, side: THREE.DoubleSide });

    this.graphSphere = new THREE.Mesh(new THREE.SphereGeometry(sphereRadius, 64, 64), sphereMaterial);

    this.sphereGraphGroup.add(this.graphSphere);

    // vertices in lat/lon
    const latLon = (lat: number, lon: number) => {
      lat = THREE.MathUtils.degToRad(lat);
      lon = THREE.MathUtils.degToRad(lon);
      return new THREE.Vector3(sphereRadius * Math.cos(lat) * Math.sin(lon), sphereRadius * Math.sin(lat), sphereRadius * Math.cos(lat) * Math.cos(lon));
    };

    this.V = { A: latLon(35, -35), B: latLon(35, 35), C: latLon(-35, 35), D: latLon(-35, -35) };

    const surfaceCurve = (a: THREE.Vector3, b: THREE.Vector3, segments = 200) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const p = a
          .clone()
          .multiplyScalar(1 - t)
          .add(b.clone().multiplyScalar(t));
        p.normalize().multiplyScalar(sphereRadius * 1.001);
        pts.push(p);
      }
      return pts;
    };

    const addEdge = (points: THREE.Vector3[], color: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
      this.sphereGraphGroup.add(line);
      return line;
    };

    const addVertex = (p: THREE.Vector3) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 20), new THREE.MeshStandardMaterial({ color: 0xffcc66 }));
      mesh.position.copy(p.clone().multiplyScalar(1.01));
      this.sphereGraphGroup.add(mesh);
    };

    const crossing = (p1: THREE.Vector3[], p2: THREE.Vector3[]) => {
      let best: THREE.Vector3;
      let min = Infinity;
      for (const a of p1)
        for (const b of p2) {
          const d = a.distanceToSquared(b);
          if (d < min) {
            min = d;
            best = a.clone().add(b).multiplyScalar(0.5);
          }
        }
      return best!.normalize().multiplyScalar(sphereRadius * 1.01);
    };

    // square edges
    addEdge(surfaceCurve(this.V.A, this.V.B), 0x90ee90);
    addEdge(surfaceCurve(this.V.B, this.V.C), 0x90ee90);
    addEdge(surfaceCurve(this.V.C, this.V.D), 0x90ee90);
    addEdge(surfaceCurve(this.V.D, this.V.A), 0x90ee90);

    const ac = surfaceCurve(this.V.A, this.V.C);
    const bd = surfaceCurve(this.V.B, this.V.D);

    this.acLine = addEdge(ac, 0xff6666);
    this.bdLine = addEdge(bd, 0x66d9ff);

    const crossPos = crossing(ac, bd);
    this.crossMarker = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.crossMarker.position.copy(crossPos);
    this.sphereGraphGroup.add(this.crossMarker);

    Object.values(this.V).forEach(addVertex);
  }

  /* ----------------- MOBIUS MATH ------------------ */

  private mobiusPoint(u: number, v: number, radius = 1.3): THREE.Vector3 {
    const x = (radius + v * Math.cos(u / 2)) * Math.cos(u);
    const y = (radius + v * Math.cos(u / 2)) * Math.sin(u);
    const z = v * Math.sin(u / 2);
    return new THREE.Vector3(x, z, y);
  }

  private mobiusDu(u: number, v: number, radius = 1.3): THREE.Vector3 {
    const A = radius + v * Math.cos(u / 2);
    const dA = -0.5 * v * Math.sin(u / 2);

    const dx = dA * Math.cos(u) - A * Math.sin(u);
    const dy = dA * Math.sin(u) + A * Math.cos(u);
    const dz = 0.5 * v * Math.cos(u / 2);

    return new THREE.Vector3(dx, dz, dy);
  }

  private mobiusDv(u: number, v: number): THREE.Vector3 {
    const dx = Math.cos(u / 2) * Math.cos(u);
    const dy = Math.cos(u / 2) * Math.sin(u);
    const dz = Math.sin(u / 2);

    return new THREE.Vector3(dx, dz, dy);
  }

  private frameOnMobius(u: number, v = 0) {
    const p = this.mobiusPoint(u, v);
    const tangent = this.mobiusDu(u, v).normalize();
    const across = this.mobiusDv(u, v).normalize();
    const normal = new THREE.Vector3().crossVectors(tangent, across).normalize();
    return { p, tangent, across, normal };
  }

  /* ----------------- GEOMETRY ------------------ */

  private buildMobiusGeometry(segmentsU = 240, segmentsV = 28, width = 0.35) {
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const red = new THREE.Color(0xff6478);
    const blue = new THREE.Color(0x5da9ff);
    const white = new THREE.Color(0xffffff);

    for (let i = 0; i <= segmentsU; i++) {
      const u = (i / segmentsU) * Math.PI * 2;

      for (let j = 0; j <= segmentsV; j++) {
        const t = j / segmentsV;
        const v = (t - 0.5) * 2 * width;

        const p = this.mobiusPoint(u, v);
        positions.push(p.x, p.y, p.z);

        let c = v < 0 ? blue.clone() : red.clone();
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

    const g = new THREE.BufferGeometry();
    g.setIndex(indices);
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();

    return g;
  }

  /* ----------------- ARROWS ------------------ */

  private createArrow(color: number, opacity = 1) {
    const arrow = new THREE.Group();

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 16), new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity }));

    shaft.position.y = 0.25;
    arrow.add(shaft);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 20), new THREE.MeshStandardMaterial({ color, transparent: opacity < 1, opacity }));

    head.position.y = 0.58;
    arrow.add(head);

    return arrow;
  }

  private placeArrow(arrow: THREE.Group, frame: any) {
    arrow.position.copy(frame.p);

    const yAxis = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(yAxis, frame.across);

    arrow.quaternion.copy(q);
  }

  /* ----------------- UTILITY ------------------ */

  private add(obj: THREE.Object3D): void {
    this.scene.add(obj);
    this.objects.push(obj);
  }

  applyStep(step: number): void {
    this.sphere.visible = step === 0;
    this.torusGroup.visible = step === 1;
    this.mobiusGroup.visible = step === 2;
    this.sphereGraphGroup.visible = step === 3;

    if (step === 3) {
      this.sphereStepStart = performance.now();
      this.handleAdded = false;
      this.handleUsed = false;
    }
  }

  private buildMugHandleCurve(start: THREE.Vector3, end: THREE.Vector3) {
    const sphereRadius = 2;

    const a = start.clone().normalize();
    const c = end.clone().normalize();

    const mid = a.clone().add(c).normalize();

    let plane = new THREE.Vector3().crossVectors(a, c);
    if (plane.lengthSq() < 1e-10) plane = new THREE.Vector3(0, 1, 0);

    plane.normalize();

    const side = new THREE.Vector3().crossVectors(plane, mid).normalize();

    const lift = 0.35;
    const flare = 0.05;

    const p0 = start.clone();

    const p1 = start.clone().multiplyScalar(1.04).add(mid.clone().multiplyScalar(0.05)).add(side.clone().multiplyScalar(-flare));

    const p2 = mid.clone().multiplyScalar(sphereRadius + lift);

    const p3 = end.clone().multiplyScalar(1.04).add(mid.clone().multiplyScalar(0.05)).add(side.clone().multiplyScalar(flare));

    const p4 = end.clone();

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4]);
    curve.curveType = 'centripetal';
    curve.tension = 0.35;

    return curve.getPoints(260);
  }

  private addHandle() {
    this.handleCurve = this.buildMugHandleCurve(this.V.A, this.V.C);

    const curve = new THREE.CatmullRomCurve3(this.handleCurve);

    const material = new THREE.MeshPhongMaterial({ color: 0x5fa8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });

    this.handleMesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 260, 0.09, 18, false), material);

    this.sphereGraphGroup.add(this.handleMesh);
  }

  private useHandle() {
    this.sphereGraphGroup.remove(this.acLine);
    this.sphereGraphGroup.remove(this.crossMarker);

    const geo = new THREE.BufferGeometry().setFromPoints(this.handleCurve);

    this.acLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff6666 }));

    this.sphereGraphGroup.add(this.acLine);
  }

  update(time: number): void {
    const s = time * 0.001;
    this.updateSurface(s);

    if (this.torusGroup.visible) {
      const loopDuration = 3000;
      const turns = (time % loopDuration) / loopDuration;
      this.updateFromSlider(turns);
    }

    if (this.mobiusGroup.visible) {
      const loopDuration = 6000;
      const turns = 4 * ((time % loopDuration) / loopDuration);
      const u = turns * Math.PI;

      const frame = this.frameOnMobius(u, 0);
      this.placeArrow(this.mobiusArrow, frame);
    }

    if (this.sphereGraphGroup.visible) {
      const elapsed = time - this.sphereStepStart;

      if (!this.handleAdded && elapsed > this.handleAddTime) {
        this.startHandleMorph();
        this.handleAdded = true;
      }

      if (!this.handleUsed && elapsed > this.handleUseTime) {
        this.useHandle();
        this.handleUsed = true;
      }

      if (this.morphingHandle) {
        this.updateHandleMorph();
      }
    }
  }

  private startHandleMorph() {
    this.handleCurve = this.buildMugHandleCurve(this.V.A, this.V.C);

    const curve = new THREE.CatmullRomCurve3(this.handleCurve);

    const material = new THREE.MeshPhongMaterial({ color: 0x5fa8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });

    this.handleMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 260, 0.001, 18, false), // start tiny
      material
    );

    this.sphereGraphGroup.add(this.handleMesh);

    this.handleMorph = 0;
    this.morphingHandle = true;
  }

  private updateHandleMorph() {
    this.handleMorph += this.handleMorphSpeed;

    const r = 0.001 + 0.09 * this.handleMorph;

    const curve = new THREE.CatmullRomCurve3(this.handleCurve);

    this.handleMesh.geometry.dispose();
    this.handleMesh.geometry = new THREE.TubeGeometry(curve, 260, r, 18, false);

    if (this.handleMorph >= 1) {
      this.morphingHandle = false;
    }
  }

  updateFromSlider(t: number) {
    const u = t * Math.PI * 2;

    const frame = this.frameOnTorus(u, 0);
    this.placeArrow(this.movingArrow, frame);

    const distToStart = frame.p.distanceTo(this.initialFrame.p);
    const align = frame.across.dot(this.initialFrame.across);

    if (distToStart < 0.035 && align > 0.999) {
      if (Math.abs(t - 1) < 0.03) {
        console.log('after 1 loop: same point, same direction');
      } else if (Math.abs(t - 2) < 0.03) {
        console.log('after 2 loops: same point, same direction');
      }
    }
  }

  private frameOnTorus(u: number, v = 0) {
    const R = 1.3;
    const r = 0.5;

    const p = new THREE.Vector3((R + r * Math.cos(v)) * Math.cos(u), (R + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v));

    const tangent = new THREE.Vector3(-(R + r * Math.cos(v)) * Math.sin(u), (R + r * Math.cos(v)) * Math.cos(u), 0).normalize();

    const across = new THREE.Vector3(-r * Math.sin(v) * Math.cos(u), -r * Math.sin(v) * Math.sin(u), r * Math.cos(v)).normalize();

    const normal = new THREE.Vector3().crossVectors(tangent, across).normalize();

    return { p, tangent, across, normal };
  }

  /* ----------------- SURFACE MORPH ------------------ */

  private smoothPulse(t: number): number {
    return 0.5 + 0.5 * Math.sin(t);
  }

  private modeWeights(t: number): [number, number, number] {
    const a = this.smoothPulse(t * 0.7);
    const b = this.smoothPulse(t * 0.7 + (Math.PI * 2) / 3);
    const c = this.smoothPulse(t * 0.7 + (Math.PI * 4) / 3);
    const sum = a + b + c;
    return [a / sum, b / sum, c / sum];
  }

  private updateSurface(time: number): void {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const [wSphere, wCube, wWave] = this.modeWeights(time);

    for (let i = 0; i < pos.length; i += 3) {
      const x0 = this.basePositions[i];
      const y0 = this.basePositions[i + 1];
      const z0 = this.basePositions[i + 2];

      const nx = this.baseNormals[i];
      const ny = this.baseNormals[i + 1];
      const nz = this.baseNormals[i + 2];

      const r = Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0);

      const sphereRadius = r * (1 + 0.05 * Math.sin(3 * nx + time * 1.3) * Math.sin(3 * ny - time * 0.9));

      const ax = Math.abs(nx);
      const ay = Math.abs(ny);
      const az = Math.abs(nz);

      const cubeFactor = Math.pow(Math.pow(ax, 10) + Math.pow(ay, 10) + Math.pow(az, 10), -1 / 10);
      const cubeRadius = r * cubeFactor * 1.08;

      const wave =
        0.2 * Math.sin(4 * nx + time * 1.7) + 0.16 * Math.sin(5 * ny - time * 1.2) + 0.12 * Math.sin(6 * nz + time * 1.9) + 0.08 * Math.sin(7 * (nx + ny + nz) - time * 1.1);

      const waveRadius = r * (1 + wave);

      const blended = wSphere * sphereRadius + wCube * cubeRadius + wWave * waveRadius;

      pos[i] = nx * blended;
      pos[i + 1] = ny * blended;
      pos[i + 2] = nz * blended;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}
