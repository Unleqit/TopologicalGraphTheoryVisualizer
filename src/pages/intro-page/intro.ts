import { Vector3 } from 'three';
import { IntroSphereHandleScene } from '../../scenes/intro-scene/intro-sphere-handle-scene';
import { IntroCylinderArrowScene } from '../../scenes/intro-scene/intro-cylinder-arrow-scene';
import { IntroMorphSphereScene } from '../../scenes/intro-scene/intro-morph-sphere-scene';
import { IntroMöbiusArrowScene } from '../../scenes/intro-scene/intro-möbius-arrow-scene';
import { IntroSceneBase } from '../../scenes/intro-scene/intro-scene-base';
import { Stepper } from '../../ui/setup-stepper';

export class IntroPage {
  private introScenes: IntroSceneBase[] = [];
  private startPositions: Vector3[] = [];
  private stepper: Stepper = new Stepper();
  private lastStep: number = -1;

  constructor() {
    const canvas = document.getElementById('viz') as HTMLCanvasElement;
    const slider = document.getElementById('uSlider') as HTMLInputElement;
    const readout = document.getElementById('readout') as HTMLElement;
    const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
    const resetBtn2 = document.getElementById('resetBtn2') as HTMLButtonElement;
    const mobiusSlider = document.getElementById('mobiusSlider') as HTMLInputElement;
    const mobiusReadout = document.getElementById('mobiusReadout') as HTMLElement;

    // Update cylinder arrow based on slider
    slider.addEventListener('input', () => {
      const t = Number(slider.value) / 1000; // normalize 0..2 loops
      this.introScenes[1].update(t, 'manual');
      readout.textContent = `turns = ${t.toFixed(3)}`;
    });

    // Hook buttons
    resetBtn.addEventListener('click', () => {
      slider.value = '0';
      slider.dispatchEvent(new Event('input'));
    });

    // Hook buttons
    resetBtn2.addEventListener('click', () => {
      mobiusSlider.value = '0';
      mobiusSlider.dispatchEvent(new Event('input'));
    });

    mobiusSlider.addEventListener('input', () => {
      const turns = Number(mobiusSlider.value) / 1000; // 0..1
      this.introScenes[2].update(turns, 'manual');
      mobiusReadout.textContent = `turns = ${turns.toFixed(3)}`;
    });

    const handleBtn = document.getElementById('handleBtn') as HTMLButtonElement;

    handleBtn.addEventListener('click', () => {
      const scene = this.introScenes[3] as IntroSphereHandleScene;
      if (!scene.isHandleAdded()) {
        handleBtn.textContent = 'Reset Handle';
        scene.startHandleMorphManual();
      } else {
        handleBtn.textContent = 'Show Handle';
        scene.resetHandle();
      }
    });

    this.introScenes = [new IntroMorphSphereScene(canvas), new IntroCylinderArrowScene(canvas), new IntroMöbiusArrowScene(canvas), new IntroSphereHandleScene(canvas)];
    this.startPositions = [new Vector3(0, 0, 8), new Vector3(-2, -2, 5), new Vector3(2, 4, 4), new Vector3(0, 0, 8)];

    this.lastStep = this.stepper.getStep();
    this.stepper.addEventListener('stepchange', (e) => {
      const step = (e as CustomEvent<number>).detail;
      this.introScenes[this.lastStep].stopAnimation();
      this.introScenes[step].startAnimation(this.startPositions[step]);
      this.lastStep = step;
    });
    this.introScenes[this.lastStep].startAnimation(this.startPositions[this.lastStep]);

    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
  }

  private resize(): void {
    const area = document.querySelector('.canvasArea') as HTMLElement;
    if (!area) {
      return;
    }
    const w = area.clientWidth;
    const h = area.clientHeight;
    this.introScenes.forEach((scene) => scene.resize(w, h));
  }
}
new IntroPage();
/*

function tick(): void {
  const cur = stepper.getStep();
  if (cur !== lastStep) {
    lastStep = cur;

    introScenes.forEach((introScene, i) => {
      introScene.setVisible(cur === i);
    });

    controls.object.position.copy(startCameraPositions[cur]);
  }

  controls.update();

  introScenes.forEach((introScene, i) => {
    if (cur === i && introScene.hasAutomaticAnimation()) {
      introScene.update();
    }
  });
  renderer.render(introScenes[cur].getScene(), camera);

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
*/
