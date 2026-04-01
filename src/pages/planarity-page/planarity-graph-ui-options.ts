import { Group, PerspectiveCamera } from 'three';
import { Stepper } from '../../ui/stepper';

export interface PlanarityGraphUIOptions {
  graphMatrixInput: HTMLTextAreaElement;
  graphListInput: HTMLTextAreaElement;
  loadGraphBtn: HTMLButtonElement;
  statusEl: HTMLElement;
  graphGroup: Group;
  camera: PerspectiveCamera;
  stepper: Stepper;
}
