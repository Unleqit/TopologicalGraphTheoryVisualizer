// intro.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { setupStepper } from "./common.js";

const stepper = setupStepper();

const canvas = document.getElementById("viz");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
camera.position.set(0, 0, 7);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.9);
dir.position.set(3, 4, 5);
scene.add(dir);

// Example: different object per step (swap these later with real visuals)
const objects = [];
function add(obj){ scene.add(obj); objects.push(obj); }

const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 48, 24),
    new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true })
);
add(sphere);

const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.5, 22, 80),
    new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true })
);
torus.visible = false;
add(torus);

const mobius = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.1, 0.35, 140, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true })
);
mobius.visible = false;
add(mobius);

function applyStep(s){
  // Step 0: sphere, Step 1: torus, Step 2: “nonorientable-ish placeholder”
  sphere.visible = (s === 0);
  torus.visible  = (s === 1);
  mobius.visible = (s === 2);
}
applyStep(stepper.getStep());

// Hook into buttons by watching step changes (simple approach: override setStep usage if needed)
// Easiest: just poll step each frame and apply if changed:
let lastStep = stepper.getStep();

function resize(){
  const area = document.querySelector(".canvasArea");
  const w = area.clientWidth, h = area.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

function tick(t){
  const s = t * 0.001;
  // update step-driven scene
  const cur = stepper.getStep();
  if (cur !== lastStep){ lastStep = cur; applyStep(cur); }

  objects.forEach(o => { o.rotation.y = s * 0.45; o.rotation.x = s * 0.2; });
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);