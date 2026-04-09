import { Raycaster, Vector2, PerspectiveCamera } from 'three';

export class PlanaritySceneMouseHandler {
  private isSelected: boolean = false;
  private isDragging: boolean = false;
  private raycaster: Raycaster;
  private mouse: Vector2;
  private canvas: HTMLCanvasElement;
  private camera: PerspectiveCamera;
  private onCtrlLeftClick: (clientX: number, clientY: number) => void;
  private onMouseDown: (clientX: number, clientY: number) => boolean;
  private onMouseMove: (clientX: number, clientY: number) => void;
  private onMouseUp: (clientX: number, clientY: number) => void;
  private onRightClick: (clientX: number, clientY: number) => void;

  constructor(
    camera: PerspectiveCamera,
    canvas: HTMLCanvasElement,
    onCtrlLeftClick: (clientX: number, clientY: number) => void,
    onMouseDown: (clientX: number, clientY: number) => boolean,
    onMouseMove: (clientX: number, clientY: number) => void,
    onMouseUp: (clientX: number, clientY: number) => void,
    onRightClick: (clientX: number, clientY: number) => void
  ) {
    this.camera = camera;
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.canvas = canvas;
    this.onCtrlLeftClick = onCtrlLeftClick;
    this.onMouseDown = onMouseDown;
    this.onMouseMove = onMouseMove;
    this.onMouseUp = onMouseUp;
    this.onRightClick = onRightClick;

    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
  }

  private event!: MouseEvent;

  private handleClick(event: MouseEvent): void {
    if (event.button !== 0) {
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
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.onMouseMove(this.mouse.x, this.mouse.y);
    this.onRightClick(this.mouse.x, this.mouse.y);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isSelected) {
      return;
    }

    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.onMouseMove(this.mouse.x, this.mouse.y);
  }

  private handleMouseUp(event: MouseEvent): void {
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

    if (event.button !== 0 || event.ctrlKey) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.isSelected = this.onMouseDown(this.mouse.x, this.mouse.y);
  }
}
