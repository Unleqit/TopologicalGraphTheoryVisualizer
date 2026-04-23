import { Raycaster, Vector2, PerspectiveCamera } from 'three';
import { PlanaritySceneBase } from './planarity-scene-base';

export class PlanaritySceneMouseHandler {
  private isSelected: boolean = false;
  private isDragging: boolean = false;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private readonly camera: PerspectiveCamera;
  private readonly canvas: HTMLCanvasElement;

  constructor(
    private readonly sceneBase: PlanaritySceneBase,
    private readonly onCtrlLeftClick: (clientX: number, clientY: number) => void,
    private readonly onMouseDown: (clientX: number, clientY: number) => boolean,
    private readonly onMouseMove: (clientX: number, clientY: number) => void,
    private readonly onMouseUp: (clientX: number, clientY: number) => void,
    private readonly onRightClick: (clientX: number, clientY: number) => void
  ) {
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.camera = this.sceneBase.getCamera();
    this.canvas = this.sceneBase.getWebGLRenderer().domElement;

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
  }

  private event!: MouseEvent;

  private handleClick(event: MouseEvent): void {
    if (event.button !== 0 || !this.sceneBase.getScene().visible) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.event.ctrlKey) {
      this.onCtrlLeftClick(this.mouse.x, this.mouse.y);
    }
  }

  private handleRightClick(event: MouseEvent): void {
    if (!this.sceneBase.getScene().visible) {
      return;
    }

    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.onMouseMove(this.mouse.x, this.mouse.y);
    this.onRightClick(this.mouse.x, this.mouse.y);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isSelected || !this.sceneBase.getScene().visible) {
      return;
    }

    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.onMouseMove(this.mouse.x, this.mouse.y);
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.sceneBase.getScene().visible) {
      return;
    }
    if (this.isDragging) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.onMouseUp(this.mouse.x, this.mouse.y);
      this.isDragging = false;
    }
    this.isSelected = false;
  }

  private handleMouseDown(event: MouseEvent): void {
    this.event = event;

    if (event.button !== 0 || event.ctrlKey || !this.sceneBase.getScene().visible) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.isSelected = this.onMouseDown(this.mouse.x, this.mouse.y);
  }
}
