import { Group, PerspectiveCamera } from 'three';
import { Stepper } from '../../ui/stepper';
import { GraphRendering } from '../../scenes/planarity-scene/planarity-scene';

export interface PlanarityGraphUIOptions {
  graphMatrixInput: HTMLTextAreaElement;
  graphListInput: HTMLTextAreaElement;
  loadGraphBtn: HTMLButtonElement;
  statusEl: HTMLElement;
  graphGroup: Group;
  camera: PerspectiveCamera;
  stepper: Stepper;
  onGraphRendered: (rendering: GraphRendering) => void;
}
