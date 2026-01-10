export class FpsCounter {
  private element: HTMLDivElement;
  private frames: number;
  private lastTime: number;
  private fps: number;

  constructor() {
    this.frames = 0;
    this.lastTime = performance.now();
    this.fps = 0;

    // Create and style the FPS counter element
    this.element = document.createElement('div');
    this.element.id = 'fps-counter';
    this.element.style.position = 'fixed';
    this.element.style.top = '10px';
    this.element.style.left = '10px';
    this.element.style.color = '#00ff00';
    this.element.style.fontFamily = 'monospace';
    this.element.style.fontSize = '16px';
    this.element.style.fontWeight = 'bold';
    this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.element.style.padding = '5px 10px';
    this.element.style.borderRadius = '3px';
    this.element.style.zIndex = '9999';
    this.element.textContent = 'FPS: 0';

    document.body.appendChild(this.element);
  }

  update(currentTime: number) {
    this.frames++;
    const elapsed = currentTime - this.lastTime;

    // Update FPS display every 500ms
    if (elapsed >= 500) {
      this.fps = Math.round((this.frames * 1000) / elapsed);
      this.element.textContent = `FPS: ${this.fps}`;
      this.frames = 0;
      this.lastTime = currentTime;
    }
  }

  getFps(): number {
    return this.fps;
  }

  remove() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
