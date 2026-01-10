import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Vector3, Vector4 } from 'lib/vector.js';
import { Trackball } from 'lib/trackball.js';
import { Matrix4 } from 'lib/matrix.js';
import { generateCrateTexture } from 'lib/web-utilities.js';
let canvas: HTMLCanvasElement;
let texturedShaderProgram: ShaderProgram;
let wireframeShaderProgram: ShaderProgram;
let texturedVao: VertexArray;
let wireframeVao: VertexArray;
let texture: WebGLTexture;
let trackball: Trackball;
let clipFromEye: Matrix4;
let eyeFromWorld: Matrix4;
let orthoProjection: Matrix4;

// Vertex data
const spatialPositions = new Float32Array([
  -0.5, -0.5, 0,  // bottom-left
  0.5, -0.5, 0,  // bottom-right
  0.5, 0.5, 0,  // top-right
  -0.5, 0.5, 0,  // top-left
]);

// Normals pointing towards camera (positive Z) - generated for 4 vertices
const normals = new Float32Array(12).fill(0).map((_, i) => i % 3 === 2 ? 1 : 0);

let texPositions = new Float32Array([
  0.2, 0.2,  // bottom-left
  0.8, 0.2,  // bottom-right
  0.8, 0.8,  // top-right
  0.2, 0.8,  // top-left
]);

const indices = new Uint32Array([
  0, 1, 2,  // first triangle
  0, 2, 3,  // second triangle
]);

let draggingVertex: number | null = null;
let isDraggingTrackball: boolean = false;

// Light source position
let lightPosition = new Vector3(2, 2, 3);

// Background quad for right panel (created once)
let bgVao: VertexArray;

// Generate a crate-like texture


async function initialize() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  // Load shaders for textured view
  const texturedVertexSource = await fetchText('textured-vertex.glsl');
  const texturedFragmentSource = await fetchText('textured-fragment.glsl');
  texturedShaderProgram = new ShaderProgram(texturedVertexSource, texturedFragmentSource);

  // Load shaders for wireframe view
  const wireframeVertexSource = await fetchText('wireframe-vertex.glsl');
  const wireframeFragmentSource = await fetchText('wireframe-fragment.glsl');
  wireframeShaderProgram = new ShaderProgram(wireframeVertexSource, wireframeFragmentSource);

  // Create texture
  const textureWidth = 256;
  const textureHeight = 256;
  const cratePixels = generateCrateTexture(textureWidth, textureHeight);

  texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, textureWidth, textureHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, cratePixels);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  // Setup vertex arrays
  updateVertexArrays();
  
  // Create background quad for right panel
  createBackgroundQuad();

  // Initialize trackball
  trackball = new Trackball(2);

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);

  resizeCanvas();
}

function updateVertexArrays() {
  // Textured view VAO
  const texturedAttributes = new VertexAttributes();
  texturedAttributes.addAttribute('position', 4, 3, spatialPositions);
  texturedAttributes.addAttribute('texPosition', 4, 2, texPositions);
  texturedAttributes.addAttribute('normal', 4, 3, normals);
  texturedAttributes.addIndices(indices);
  texturedVao = new VertexArray(texturedShaderProgram, texturedAttributes);

  // Wireframe view VAO (uses texture coordinates directly)
  const wireframePositions = new Float32Array(texPositions);
  const wireframeAttributes = new VertexAttributes();
  wireframeAttributes.addAttribute('position', 4, 2, wireframePositions);
  wireframeAttributes.addIndices(indices);
  wireframeVao = new VertexArray(wireframeShaderProgram, wireframeAttributes);
}

function createBackgroundQuad() {
  const bgPositions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);
  const bgTexCoords = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
  const bgNormals = new Float32Array(12).fill(0).map((_, i) => i % 3 === 2 ? 1 : 0);
  const bgIndices = new Uint32Array([0, 1, 2, 0, 2, 3]);
  
  const bgAttributes = new VertexAttributes();
  bgAttributes.addAttribute('position', 4, 3, bgPositions);
  bgAttributes.addAttribute('texPosition', 4, 2, bgTexCoords);
  bgAttributes.addAttribute('normal', 4, 3, bgNormals);
  bgAttributes.addIndices(bgIndices);
  bgVao = new VertexArray(texturedShaderProgram, bgAttributes);
}

// Convert screen coordinates to world space using inverse ortho projection
function screenToWorld(x: number, y: number): Vector3 {
  const panelWidth = canvas.width / 2;
  
  const mousePixel = new Vector4(
    x - panelWidth,  // Adjust for right panel offset
    canvas.height - 1 - y,
    0,
    1
  );

  const mouseNormalized = new Vector4(
    mousePixel.x / panelWidth * 2 - 1,
    mousePixel.y / canvas.height * 2 - 1,
    0.5,
    1
  );

  const eyeFromClip = orthoProjection.inverse();
  const worldFromEye = Matrix4.identity();

  let mouseEye = eyeFromClip.multiplyVector4(mouseNormalized);
  mouseEye = mouseEye.multiplyScalar(1 / mouseEye.w);
  
  let mouseWorld = worldFromEye.multiplyVector4(mouseEye);
  return new Vector3(mouseWorld.x, mouseWorld.y, mouseWorld.z);
}

// Convert texture coordinates to world space
function texToWorld(texX: number, texY: number): { x: number, y: number } {
  return {
    x: (texX - 0.5) * 2,
    y: (texY - 0.5) * 2
  };
}

// Convert world space to texture coordinates
function worldToTex(worldX: number, worldY: number): { x: number, y: number } {
  return {
    x: Math.max(0, Math.min(1, worldX / 2 + 0.5)),
    y: Math.max(0, Math.min(1, worldY / 2 + 0.5))
  };
}

// Get pointer position relative to canvas
function getPointerPosition(event: PointerEvent): { x: number, y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

// Set lighting uniforms for textured shader
function setLightingUniforms(program: ShaderProgram, ambient: number, specular: [number, number, number], shininess: number) {
  const lightPositionEye = eyeFromWorld.multiplyPosition(lightPosition);
  program.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
  program.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
  program.setUniform3f('specularColor', specular[0], specular[1], specular[2]);
  program.setUniform1f('ambientFactor', ambient);
  program.setUniform1f('shininess', shininess);
}

// Bind texture to unit 0
function bindTexture() {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
}

// Unbind texture
function unbindTexture() {
  gl.bindTexture(gl.TEXTURE_2D, null);
}

// Release pointer capture and reset state
function releasePointer(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    if (isDraggingTrackball) {
      trackball.end();
      isDraggingTrackball = false;
    }
    draggingVertex = null;
    canvas.releasePointerCapture(event.pointerId);
  }
}

function onPointerDown(event: PointerEvent) {
  const { x, y } = getPointerPosition(event);
  const panelWidth = canvas.width / 2;

  if (x <= panelWidth) {
    // Left panel - trackball rotation
    isDraggingTrackball = true;
    trackball.start(new Vector3(event.clientX, event.clientY, 0));
    canvas.setPointerCapture(event.pointerId);
  } else {
    // Right panel - vertex dragging
    const clickWorld = screenToWorld(x, y);
    let closestVertex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < 4; i++) {
      const texX = texPositions[i * 2 + 0];
      const texY = texPositions[i * 2 + 1];
      const world = texToWorld(texX, texY);
      
      const dist = Math.sqrt((world.x - clickWorld.x) ** 2 + (world.y - clickWorld.y) ** 2);

      if (dist < 0.1 && dist < closestDist) {
        closestVertex = i;
        closestDist = dist;
      }
    }

    if (closestVertex >= 0) {
      draggingVertex = closestVertex;
      canvas.setPointerCapture(event.pointerId);
    }
  }
}

function onPointerMove(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    if (isDraggingTrackball) {
      trackball.drag(new Vector3(event.clientX, event.clientY, 0));
      render();
    } else if (draggingVertex !== null) {
      const { x, y } = getPointerPosition(event);
      const dragWorld = screenToWorld(x, y);
      const tex = worldToTex(dragWorld.x, dragWorld.y);

      texPositions[draggingVertex * 2 + 0] = tex.x;
      texPositions[draggingVertex * 2 + 1] = tex.y;

      updateVertexArrays();
      render();
    }
  }
}

function onPointerUp(event: PointerEvent) {
  releasePointer(event);
}

function onPointerCancel(event: PointerEvent) {
  if (isDraggingTrackball) trackball.cancel();
  releasePointer(event);
}

function render() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Render left panel - textured view with rotation
  gl.viewport(0, 0, canvas.width / 2, canvas.height);
  gl.enable(gl.DEPTH_TEST);

  texturedShaderProgram.bind();
  texturedShaderProgram.setUniform1i('crateTexture', 0);

  // Set transformation matrices
  texturedShaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
  texturedShaderProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);
  texturedShaderProgram.setUniformMatrix4fv('worldFromModel', trackball.rotater.elements);

  setLightingUniforms(texturedShaderProgram, 0.2, [0.3, 0.3, 0.3], 50.0);

  bindTexture();

  texturedVao.bind();
  texturedVao.drawIndexed(gl.TRIANGLES);
  texturedVao.unbind();

  unbindTexture();
  texturedShaderProgram.unbind();

  // Render right panel - wireframe view with texture
  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.disable(gl.DEPTH_TEST);

  // Draw the texture as background
  texturedShaderProgram.bind();

  // Use orthographic projection for 2D rendering
  const identity = Matrix4.identity();
  texturedShaderProgram.setUniformMatrix4fv('clipFromEye', orthoProjection.elements);
  texturedShaderProgram.setUniformMatrix4fv('eyeFromWorld', identity.elements);
  texturedShaderProgram.setUniformMatrix4fv('worldFromModel', identity.elements);

  setLightingUniforms(texturedShaderProgram, 1.0, [0, 0, 0], 1.0);

  bindTexture();

  bgVao.bind();
  bgVao.drawIndexed(gl.TRIANGLES);
  bgVao.unbind();

  unbindTexture();
  texturedShaderProgram.unbind();

  // Draw wireframe overlay
  wireframeShaderProgram.bind();
  wireframeVao.bind();
  
  // Transform [0,1] texture coordinates to [-1,1] world space, then apply ortho projection
  // This ensures the wireframe matches the background texture regardless of aspect ratio
  const texToWorld = Matrix4.scale(2, 2, 1).multiplyMatrix(Matrix4.translate(-0.5, -0.5, 0));
  const clipFromTexture = orthoProjection.multiplyMatrix(texToWorld);
  
  wireframeShaderProgram.setUniformMatrix4fv('clipFromTexture', clipFromTexture.elements);
  wireframeShaderProgram.setUniform3f('color', 1, 1, 1);

  // Draw lines
  gl.lineWidth(2);
  wireframeVao.drawIndexed(gl.LINE_LOOP);
  wireframeShaderProgram.setUniform3f('color', 0.1, 0.1, 0.1);
  // Draw points
  wireframeVao.drawSequence(gl.POINTS);

  wireframeVao.unbind();
  wireframeShaderProgram.unbind();
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Setup perspective projection for left panel
  const panelWidth = canvas.clientWidth / 2;
  const aspectRatio = panelWidth / canvas.clientHeight;
  const fovY = 45;
  const near = 0.1;
  const far = 100;
  clipFromEye = Matrix4.perspective(fovY, aspectRatio, near, far);
  eyeFromWorld = Matrix4.translate(0, 0, -2);

  // Setup orthographic projection for right panel
  const rightAspectRatio = panelWidth / canvas.clientHeight;
  if (rightAspectRatio > 1) {
    // Wider than tall
    orthoProjection = Matrix4.ortho(-rightAspectRatio, rightAspectRatio, -1, 1, -1, 1);
  } else {
    // Taller than wide
    orthoProjection = Matrix4.ortho(-1, 1, -1 / rightAspectRatio, 1 / rightAspectRatio, -1, 1);
  }

  // Calculate the square's radius in pixels for trackball
  const squareWorldRadius = 0.7;
  const squareDistance = 2.0;
  const fovRadians = fovY * Math.PI / 180;
  const viewportHeight = 2 * squareDistance * Math.tan(fovRadians / 2);
  const pixelsPerUnit = canvas.height / viewportHeight;
  const squareRadiusPixels = squareWorldRadius * pixelsPerUnit;

  trackball.setViewport(panelWidth, canvas.height, squareRadiusPixels);

  render();
}

window.addEventListener('load', () => initialize());
