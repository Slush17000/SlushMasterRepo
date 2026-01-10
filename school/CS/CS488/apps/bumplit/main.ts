import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Gltf } from 'lib/static-gltf.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3 } from 'lib/vector.js';
let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;

let vaoGltf: VertexArray;
let clipFromEye: Matrix4;
let eyeFromWorld: Matrix4;
let worldFromModel: Matrix4;
let currentRadians = 0;
let isRotating = false;
let then: number | null = null;
// rotationSpeed in radians per second (full rotation in ~6 seconds)
const rotationSpeed = Math.PI * 2 / 6;

let lightPosition: Vector3 = new Vector3(0, 0, -5);

// Lissajous pattern parameters
const lissajousA = 4.0;  // width scale
const lissajousB = 8.0;  // height scale
const lissajousRatio = 2.0;  // frequency ratio for figure-8
let lightZ = -5.0;  // z-coordinate for light position

// Key state tracking
const keys: { [key: string]: boolean } = {};

// Pointer drag state for interactive rotation
let dragging = false;
let dragStartX = 0;
let dragStartAngle = 0;
let wasRotatingBeforeDrag = false;
const dragSensitivity = 0.01; // radians per pixel

async function initialize() {

  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  const vertexSource = await fetchText('flat-vertex.glsl');
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  await initializeModel();
  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Pointer events for interactive rotation
  canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
  canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
  canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
  canvas.addEventListener('pointercancel', (ev) => onPointerUp(ev));

  resizeCanvas();
  // start the animation loop
  requestAnimationFrame(animate);

}

async function initializeModel() {
  // Load a glTF model
  const model = await Gltf.readFromUrl('../../models/bumpy.gltf');
  const mesh = model.meshes[0];
  const attrsGltf = new VertexAttributes();
  attrsGltf.addAttribute('position', mesh.positions.count, 3, mesh.positions.buffer);
  attrsGltf.addAttribute('normal', mesh.normals!.count, 3, mesh.normals!.buffer);
  attrsGltf.addIndices(new Uint32Array(mesh.indices!.buffer));
  vaoGltf = new VertexArray(shaderProgram, attrsGltf);
}

function handleKeyDown(event: KeyboardEvent) {
  keys[event.key.toLowerCase()] = true;
}

function handleKeyUp(event: KeyboardEvent) {
  keys[event.key.toLowerCase()] = false;
}

function updateLightPosition(elapsed: number) {
  // Update z-coordinate based on keyboard input
  const zSpeed = 0.005; // units per millisecond
  if (keys['w']) lightZ -= elapsed * zSpeed; // Move closer (negative z)
  if (keys['s']) lightZ += elapsed * zSpeed; // Move farther (positive z)
}

function onPointerDown(ev: PointerEvent) {
  if (!canvas) return;
  dragging = true;
  dragStartX = ev.clientX;
  dragStartAngle = currentRadians;
  wasRotatingBeforeDrag = isRotating;
  // pause auto-rotate while dragging
  isRotating = false;
  try { canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
}

function onPointerMove(ev: PointerEvent) {
  if (!dragging) return;
  const dx = ev.clientX - dragStartX;
  currentRadians = dragStartAngle + (-dx) * dragSensitivity;
  // normalize
  currentRadians = ((currentRadians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  render();
}

function onPointerUp(ev: PointerEvent) {
  if (!dragging) return;
  dragging = false;
  try { canvas.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
  // resume auto-rotate if it was running before drag
  isRotating = wasRotatingBeforeDrag;
}

function animate(now: DOMHighResTimeStamp) {
  const elapsed = then ? now - then : 0;

  // Update rotation if auto-rotating
  if (isRotating) {
    currentRadians += rotationSpeed * (elapsed / 1000); // elapsed is in milliseconds
    if (currentRadians >= Math.PI * 2) currentRadians -= Math.PI * 2;
  }

  // Update light z-coordinate based on keyboard input
  updateLightPosition(elapsed);


  const t = performance.now() * 0.001;
  const x = lissajousA * Math.sin(lissajousRatio * t);
  const y = lissajousB * Math.sin(t);
  
  // Update light position with Lissajous pattern and user-controlled z
  lightPosition = new Vector3(x, y, lightZ);

  render();
  requestAnimationFrame(animate);
  then = now;
}

function render() {
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  shaderProgram.bind();

  // Build worldFromModel matrix: translate * rotateY * scale
  worldFromModel = Matrix4.translate(0.0, 0.0, 0.0)
    .multiplyMatrix(Matrix4.rotateY((currentRadians * 180.0 / Math.PI)));

  // Pass the three matrices as separate uniforms to be computed in the shader
  shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
  shaderProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);
  shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);

  //set light position uniform
  const lightPosEye = eyeFromWorld.multiplyPosition(lightPosition);
  shaderProgram.setUniform3f('lightPositionEye', lightPosEye.x, lightPosEye.y, lightPosEye.z);
  shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
  shaderProgram.setUniform3f('specularColor', 1.0, 1.0, 1.0);
  shaderProgram.setUniform1f('ambientFactor', 0.1);
  shaderProgram.setUniform1f('shininess', 1000.0);
  shaderProgram.setUniform3f('albedo', 0.0, 0.0, 0.4);
  vaoGltf.bind();

  vaoGltf.drawIndexed(gl.TRIANGLES);
  vaoGltf.unbind();
  shaderProgram.unbind();
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const aspectRatio = canvas.clientWidth / canvas.clientHeight;

  const fovY = 75;
  const near = 0.1;
  const far = 1000;
  clipFromEye = Matrix4.perspective(fovY, aspectRatio, near, far);

  const cameraZ = 8.0;
  eyeFromWorld = Matrix4.translate(0, 0, -cameraZ);

  render();
}

window.addEventListener('load', () => initialize());
