// script.ts
import './base.css';
import './styles.css';

import * as THREE from 'three';
import { setupStepper } from './common';

const stepper = setupStepper();

// Get canvas and type it correctly
const canvas = document.getElementById('viz') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 0, 7);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 4, 5);
scene.add(dir);

// Objects array
const objects: THREE.Object3D[] = [];

// Helper to add objects
function add(obj: THREE.Object3D): void {
  scene.add(obj);
  objects.push(obj);
}

// Create geometries
const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.4, 48, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
add(sphere);

const torus = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.5, 22, 80), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
torus.visible = false;
add(torus);

const mobius = new THREE.Mesh(new THREE.TorusKnotGeometry(1.1, 0.35, 140, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }));
mobius.visible = false;
add(mobius);

// Apply step to show/hide objects
function applyStep(s: number): void {
  sphere.visible = s === 0;
  torus.visible = s === 1;
  mobius.visible = s === 2;
}
applyStep(stepper.getStep());

// Track last step
let lastStep = stepper.getStep();

// Handle resize
function resize(): void {
  const area = document.querySelector('.canvasArea') as HTMLElement;
  if (!area) {
    return;
  }

  const w = area.clientWidth;
  const h = area.clientHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// Animation loop
function tick(t: number): void {
  const s = t * 0.001;

  // Check for step changes
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;
    applyStep(cur);
  }

  // Rotate all objects
  objects.forEach((o) => {
    o.rotation.y = s * 0.45;
    o.rotation.x = s * 0.2;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
