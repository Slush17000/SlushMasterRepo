import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Prefab } from 'lib/prefab.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3 } from 'lib/vector.js';
import { Trackball } from 'lib/trackball.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let clipFromEye: Matrix4;
let eyeFromWorld: Matrix4;

// VAOs for different objects
let torusVao: VertexArray;
let outerSphereVao: VertexArray;
let coneVao: VertexArray;

let trackball: Trackball;
let lightPosition = new Vector3(0, 5, 5);

async function initialize() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  const vertexSource = await fetchText('flat-vertex.glsl');
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  // Create torus
  const torusMesh = Prefab.torus(0.1, 0.4, 50, 50);
  torusMesh.computeNormals();
  const torusAttributes = new VertexAttributes();
  torusAttributes.addAttribute('position', torusMesh.vertexCount, 3, torusMesh.positionBuffer);
  torusAttributes.addAttribute('normal', torusMesh.vertexCount, 3, torusMesh.normalBuffer);
  torusAttributes.addIndices(torusMesh.faceBuffer);
  torusVao = new VertexArray(shaderProgram, torusAttributes);

  // Create outer sphere (transparent-ish)
  const outerSphereMesh = Prefab.sphere(1.0, 30, 30);
  outerSphereMesh.computeNormals();
  const outerSphereAttributes = new VertexAttributes();
  outerSphereAttributes.addAttribute('position', outerSphereMesh.vertexCount, 3, outerSphereMesh.positionBuffer);
  outerSphereAttributes.addAttribute('normal', outerSphereMesh.vertexCount, 3, outerSphereMesh.normalBuffer);
  outerSphereAttributes.addIndices(outerSphereMesh.faceBuffer);
  outerSphereVao = new VertexArray(shaderProgram, outerSphereAttributes);

  // Create cone
  const coneMesh = Prefab.sphere(.1, 100, 100);
  coneMesh.computeNormals();
  const coneAttributes = new VertexAttributes();
  coneAttributes.addAttribute('position', coneMesh.vertexCount, 3, coneMesh.positionBuffer);
  coneAttributes.addAttribute('normal', coneMesh.vertexCount, 3, coneMesh.normalBuffer);
  coneAttributes.addIndices(coneMesh.faceBuffer);
  coneVao = new VertexArray(shaderProgram, coneAttributes);

  // Initialize trackball
  trackball = new Trackball(1.0);

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());
  canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
  canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
  canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
  canvas.addEventListener('pointercancel', (ev) => onPointerCancel(ev));

  resizeCanvas();
}

function onPointerDown(event: PointerEvent) {
  trackball.start(new Vector3(event.clientX, event.clientY, 0));
  canvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    trackball.drag(new Vector3(event.clientX, event.clientY, 0));
    render();
  }
}

function onPointerUp(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    trackball.end();
    canvas.releasePointerCapture(event.pointerId);
  }
}

function onPointerCancel(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    trackball.cancel();
    canvas.releasePointerCapture(event.pointerId);
  }
}

function render() {
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Black background
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  shaderProgram.bind();

  // Transform light to eye space
  const lightPositionEye = eyeFromWorld.multiplyPosition(lightPosition);
  shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
  shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
  shaderProgram.setUniform3f('specularColor', 0.5, 0.5, 0.5);

  // Upload transformation matrices
  shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
  shaderProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);

  // Render opaque objects first (torus, cone, inner spheres)
  
  // Render torus (blue)
  const torusWorld = trackball.rotater.multiplyMatrix(Matrix4.rotateX(90));
  shaderProgram.setUniformMatrix4fv('worldFromModel', torusWorld.elements);
  shaderProgram.setUniform3f('albedo', 0.0, 0.0, 1.0);
  shaderProgram.setUniform1f('ambientFactor', 0.3);
  shaderProgram.setUniform1f('shininess', 100.0);
  torusVao.bind();
  torusVao.drawIndexed(gl.TRIANGLES);
  torusVao.unbind();

  // Render cone (red) - positioned on the edge of the outer sphere
  const coneWorld = trackball.rotater.multiplyMatrix(Matrix4.translate(0, 1.0, 0));
  shaderProgram.setUniformMatrix4fv('worldFromModel', coneWorld.elements);
  shaderProgram.setUniform3f('albedo', 1.0, 0.0, 1.0);
  shaderProgram.setUniform1f('ambientFactor', 0.3);
  shaderProgram.setUniform1f('shininess', 80.0);
  coneVao.bind();
  coneVao.drawIndexed(gl.TRIANGLES);
  coneVao.unbind();

  // Enable blending for transparent outer sphere
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false); // Don't write to depth buffer for transparent objects

  // Render outer sphere last (transparent white)
  const outerSphereWorld = trackball.rotater;
  shaderProgram.setUniformMatrix4fv('worldFromModel', outerSphereWorld.elements);
  shaderProgram.setUniform3f('albedo', 1.0, 1.0, 1.0);
  shaderProgram.setUniform1f('ambientFactor', 0.6);
  shaderProgram.setUniform3f('specularColor', 0, 0, 0);
  outerSphereVao.bind();
  outerSphereVao.drawIndexed(gl.TRIANGLES);
  outerSphereVao.unbind();

  // Restore default state
  gl.disable(gl.BLEND);
  gl.depthMask(true);

  shaderProgram.unbind();
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const aspectRatio = canvas.clientWidth / canvas.clientHeight;
  const fovY = 45;
  const near = 0.1;
  const far = 100;
  clipFromEye = Matrix4.perspective(fovY, aspectRatio, near, far);
  eyeFromWorld = Matrix4.translate(0, 0, -4);

  // Calculate the sphere's radius in pixels
  // The sphere has radius 1.0 and is at distance 4.0 from camera
  const sphereWorldRadius = 1.0;
  const sphereDistance = 4.0;
  const fovRadians = fovY * Math.PI / 180;
  const viewportHeight = 2 * sphereDistance * Math.tan(fovRadians / 2);
  const pixelsPerUnit = canvas.height / viewportHeight;
  const sphereRadiusPixels = sphereWorldRadius * pixelsPerUnit;
  
  trackball.setViewport(canvas.width, canvas.height, sphereRadiusPixels);

  render();
}

window.addEventListener('load', () => initialize());
