import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Prefab } from 'lib/prefab.js';
import { Matrix4 } from 'lib/matrix.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let vao: VertexArray;
let clipFromWorld: Float32Array;
let rotationRadiansX: number = 0;
let rotationRadiansY: number = 0;
let rafId: number | null = null;
let lastTimestamp: number | null = null;
const rotationSpeed = Math.PI * 2 / 10; // full rotation in ~10 seconds

let dragging = false;
let dragStartX = 0;
let dragStartAngle = 0;
let dragStartY = 0;
let dragStartAngleY = 0;
const dragSensitivity = .01; // radians per pixel

async function initialize() {

  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  const radius = 0.3;
  const height = 6.0;
  const longitudeCount = 100;
  const latitudeCount = 300;
  const amplitude = .04;
  const waves = 10;
  const trimesh = Prefab.oscillatingCylinder(radius, height, longitudeCount, latitudeCount, amplitude, waves);
  const attributes = new VertexAttributes();
  trimesh.computeNormals();
  const torusNormals = trimesh.normalBuffer;
  attributes.addAttribute('position', trimesh.vertexCount, 3, trimesh.positionBuffer);
  attributes.addIndices(trimesh.faceBuffer);
  attributes.addAttribute('normal', trimesh.vertexCount, 3, torusNormals);

  // Load, compile, and link shaders
  const vertexSource = await fetchText('flat-vertex.glsl');
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  vao = new VertexArray(shaderProgram, attributes);

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());
  canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
  canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
  canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
  canvas.addEventListener('pointercancel', (ev) => onPointerUp(ev));
  window.addEventListener('keydown', event => {
    const step = 0.02 * Math.PI;
    if (event.key === 'a') {
      rotationRadiansX += step;
      render();
    } else if (event.key === 'd') {
      rotationRadiansX -= step;
      render();
    } else if (event.key === 'w') {
      rotationRadiansY -= step;
      render();
    } else if (event.key === 's') {
      rotationRadiansY += step;
      render();
    }
  });

  resizeCanvas();
  startAnimation();
}

function onPointerDown(ev: PointerEvent) {
  if (!canvas) return;
  dragging = true;
  // only allow dragging to control the X rotation (pitch). Y (yaw) is auto-rotating.
  dragStartY = ev.clientY;
  dragStartAngleY = rotationRadiansY;
  try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
}

function onPointerMove(ev: PointerEvent) {
  if (!dragging) return;
  const dy = ev.clientY - dragStartY;

  rotationRadiansY = dragStartAngleY + dy * dragSensitivity;
  rotationRadiansX = ((rotationRadiansX % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  rotationRadiansY = ((rotationRadiansY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  render();
}

function onPointerUp(ev: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
}

function startAnimation() {
  if (rafId !== null) return;
  lastTimestamp = null;
  rafId = requestAnimationFrame(animate);
}

function stopAnimation() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastTimestamp = null;
}

function animate(timestamp: number) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dt = (timestamp - lastTimestamp) / 1000; // seconds
  lastTimestamp = timestamp;
  // auto-rotate yaw (rotationRadiansX)
  rotationRadiansX += rotationSpeed * dt * 4;
  rotationRadiansX = ((rotationRadiansX % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  render();
  rafId = requestAnimationFrame(animate);
}

function render() {

  const matrix = Matrix4.identity()
    .multiplyMatrix(Matrix4.rotateX(rotationRadiansY * 180 / Math.PI + 90))
    .multiplyMatrix(Matrix4.rotateY(-(rotationRadiansX * 180 / Math.PI)))
    .multiplyMatrix(Matrix4.scale(1, 1, 1));
  // gl.enable(gl.CULL_FACE);
  // gl.cullFace(gl.FRONT);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.enable(gl.DEPTH_TEST);
  shaderProgram.bind();
  shaderProgram.setUniformMatrix4fv("transform", matrix.elements);
  shaderProgram.setUniformMatrix4fv('clipFromWorld', clipFromWorld);

  shaderProgram.setUniform3f('colorParam', 1, 1, 1);


  vao.bind();
  vao.drawIndexed(gl.TRIANGLES);
  vao.unbind();
  shaderProgram.unbind();
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  // Use a perspective projection for a tunnel-like view
  const fovY = 60; // degrees
  const near = 0.1;
  const far = 20;
  const projection = Matrix4.perspective(fovY, aspectRatio, near, far);
  // place the camera back along +Z so the world is in front of it
  const cameraZ = 3.0;
  const view = Matrix4.translate(0, 0, -cameraZ);
  clipFromWorld = projection.multiplyMatrix(view).elements;
  render();
}

window.addEventListener('load', () => initialize());