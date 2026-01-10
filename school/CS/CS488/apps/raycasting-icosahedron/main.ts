import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Prefab } from 'lib/prefab.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3, Vector4 } from 'lib/vector.js';
import { Trackball } from 'lib/trackball.js';
import { intersectRayIcosahedron } from 'lib/intersect.js';
import { Trimesh } from 'lib/trimesh.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let unlitProgram: ShaderProgram; // Shader for unlit edges
let clipFromEye: Matrix4;
let eyeFromWorld: Matrix4;
let worldFromEye: Matrix4;
let eyeFromClip: Matrix4;

// VAOs for different objects
let icosahedronVao: VertexArray;
let edgesVao: VertexArray;
let edgeCount: number;
let intersectionVao: VertexArray;
let rayVao: VertexArray;

let trackball: Trackball;
let lightPosition = new Vector3(0, 5, 5);

// Store intersection points and rays
let intersectionPoints: Vector3[] = [];
let rays: { start: Vector3; end: Vector3 }[] = [];

// Track dragging state
let isDragging = false;

// Camera distance for zooming
let cameraDistance = 5.0;

// Icosahedron properties
const size = 2.0;

async function initialize() {
  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  const vertexSource = await fetchText('flat-vertex.glsl');
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  const unlitVertexSource = await fetchText('unlit-vertex.glsl');
  const unlitFragmentSource = await fetchText('unlit-fragment.glsl');
  unlitProgram = new ShaderProgram(unlitVertexSource, unlitFragmentSource);

  // Create icosahedron manually
  const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
  const scale = size / 2;
  
  // 12 vertices of an icosahedron
  const icosahedronVertices = [
    // Rectangle in XY plane
    new Vector3(-1, phi, 0).normalize().multiplyScalar(scale),
    new Vector3(1, phi, 0).normalize().multiplyScalar(scale),
    new Vector3(-1, -phi, 0).normalize().multiplyScalar(scale),
    new Vector3(1, -phi, 0).normalize().multiplyScalar(scale),
    // Rectangle in YZ plane
    new Vector3(0, -1, phi).normalize().multiplyScalar(scale),
    new Vector3(0, 1, phi).normalize().multiplyScalar(scale),
    new Vector3(0, -1, -phi).normalize().multiplyScalar(scale),
    new Vector3(0, 1, -phi).normalize().multiplyScalar(scale),
    // Rectangle in XZ plane
    new Vector3(phi, 0, -1).normalize().multiplyScalar(scale),
    new Vector3(phi, 0, 1).normalize().multiplyScalar(scale),
    new Vector3(-phi, 0, -1).normalize().multiplyScalar(scale),
    new Vector3(-phi, 0, 1).normalize().multiplyScalar(scale)
  ];
  
  // 20 triangular faces
  const icosahedronFaces = [
    // 5 faces around vertex 0
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    // 5 adjacent faces
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    // 5 faces around vertex 3
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    // 5 adjacent faces
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1]
  ];
  
  const icosahedronMesh = new Trimesh(icosahedronVertices, icosahedronFaces);
  icosahedronMesh.computeNormals();
  const icosahedronAttributes = new VertexAttributes();
  icosahedronAttributes.addAttribute('position', icosahedronMesh.vertexCount, 3, icosahedronMesh.positionBuffer);
  icosahedronAttributes.addAttribute('normal', icosahedronMesh.vertexCount, 3, icosahedronMesh.normalBuffer);
  icosahedronAttributes.addIndices(icosahedronMesh.faceBuffer);
  icosahedronVao = new VertexArray(shaderProgram, icosahedronAttributes);

  // Create edges for wireframe
  const edges: number[] = [];
  const edgeSet = new Set<string>();
  for (const face of icosahedronFaces) {
    for (let i = 0; i < 3; i++) {
      const v1 = face[i];
      const v2 = face[(i + 1) % 3];
      const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push(v1, v2);
      }
    }
  }
  
  const edgePositions: number[] = [];
  for (let i = 0; i < edges.length; i++) {
    const vertex = icosahedronVertices[edges[i]];
    edgePositions.push(vertex.x, vertex.y, vertex.z);
  }
  
  edgeCount = edgePositions.length / 3; // Store count for rendering
  
  const edgeAttributes = new VertexAttributes();
  edgeAttributes.addAttribute('position', edgePositions.length / 3, 3, new Float32Array(edgePositions));
  edgesVao = new VertexArray(unlitProgram, edgeAttributes);

  // Create small sphere for intersection points
  const intersectionMesh = Prefab.sphere(0.05, 20, 20);
  intersectionMesh.computeNormals();
  const intersectionAttributes = new VertexAttributes();
  intersectionAttributes.addAttribute('position', intersectionMesh.vertexCount, 3, intersectionMesh.positionBuffer);
  intersectionAttributes.addAttribute('normal', intersectionMesh.vertexCount, 3, intersectionMesh.normalBuffer);
  intersectionAttributes.addIndices(intersectionMesh.faceBuffer);
  intersectionVao = new VertexArray(shaderProgram, intersectionAttributes);

  // Create cylinder for rays
  const rayMesh = Prefab.cylinder(0.02, 1, 20, 2);
  rayMesh.computeNormals();
  const rayAttributes = new VertexAttributes();
  rayAttributes.addAttribute('position', rayMesh.vertexCount, 3, rayMesh.positionBuffer);
  rayAttributes.addAttribute('normal', rayMesh.vertexCount, 3, rayMesh.normalBuffer);
  rayAttributes.addIndices(rayMesh.faceBuffer);
  rayVao = new VertexArray(shaderProgram, rayAttributes);

  // Initialize trackball
  trackball = new Trackball(1.0);

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());
  canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
  canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
  canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
  canvas.addEventListener('pointercancel', (ev) => onPointerCancel(ev));
  canvas.addEventListener('click', (ev) => onMouseClick(ev));
  canvas.addEventListener('wheel', (ev) => onWheel(ev), { passive: false });

  resizeCanvas();
}

function onPointerDown(event: PointerEvent) {
  isDragging = false;
  trackball.start(new Vector3(event.clientX, event.clientY, 0));
  canvas.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    isDragging = true;
    trackball.drag(new Vector3(event.clientX, event.clientY, 0));
    render();
  }
}

function onPointerUp(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    trackball.end();
    canvas.releasePointerCapture(event.pointerId);
    setTimeout(() => { isDragging = false; }, 0);
  }
}

function onPointerCancel(event: PointerEvent) {
  if (canvas.hasPointerCapture(event.pointerId)) {
    trackball.cancel();
    canvas.releasePointerCapture(event.pointerId);
    isDragging = false;
  }
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  
  const zoomSpeed = 0.001;
  cameraDistance += event.deltaY * zoomSpeed;
  cameraDistance = Math.max(2.0, Math.min(20.0, cameraDistance));
  
  resizeCanvas();
}

function onMouseClick(event: MouseEvent) {
  if (isDragging) {
    isDragging = false;
    return;
  }

  // Convert mouse pixel coordinates to normalized device coordinates
  const mousePixel = new Vector4(
    event.clientX,
    canvas.height - 1 - event.clientY,
    0,
    1
  );

  const mouseNormalized = new Vector4(
    mousePixel.x / canvas.width * 2 - 1,
    mousePixel.y / canvas.height * 2 - 1,
    -1,
    1
  );

  // Transform from clip space to eye space (near plane)
  let mouseEye = eyeFromClip.multiplyVector4(mouseNormalized);
  mouseEye = mouseEye.divideScalar(mouseEye.w);

  // Transform from eye space to world space
  const mouseWorld = worldFromEye.multiplyVector4(mouseEye);
  const rayStart = new Vector3(mouseWorld.x, mouseWorld.y, mouseWorld.z);

  // Find the end point on the far clipping plane
  const mouseNormalizedFar = new Vector4(
    mousePixel.x / canvas.width * 2 - 1,
    mousePixel.y / canvas.height * 2 - 1,
    1,
    1
  );
  let mouseEyeFar = eyeFromClip.multiplyVector4(mouseNormalizedFar);
  mouseEyeFar = mouseEyeFar.divideScalar(mouseEyeFar.w);
  const mouseWorldFar = worldFromEye.multiplyVector4(mouseEyeFar);
  const rayEnd = new Vector3(mouseWorldFar.x, mouseWorldFar.y, mouseWorldFar.z);

  // Compute ray direction
  const rayDirection = rayEnd.subtract(rayStart).normalize();

  // Store rays in model space (inverse of trackball rotation)
  const inverseRotation = trackball.rotater.inverse();
  const rayStartModel = inverseRotation.multiplyVector3(rayStart);
  const rayEndModel = inverseRotation.multiplyVector3(rayEnd);
  const rayDirectionModel = rayEndModel.subtract(rayStartModel).normalize();

  // Find intersections with the icosahedron in model space
  const intersections = intersectRayIcosahedron(rayStartModel, rayDirectionModel, size);

  if (intersections.length > 0) {
    // Store the ray segment in model space
    if (intersections.length === 2) {
      rays.push({
        start: intersections[0],
        end: intersections[1]
      });
    } else if (intersections.length === 1) {
      rays.push({
        start: intersections[0],
        end: intersections[0]
      });
    }
    
    // Store intersection points in model space
    intersectionPoints.push(...intersections);
  }

  render();
}

function render() {
  gl.disable(gl.CULL_FACE);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
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

  // Enable blending for semi-transparent icosahedron
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);

  // Render main icosahedron (semi-transparent violet/purple)
  const icosahedronWorld = trackball.rotater;
  shaderProgram.setUniformMatrix4fv('worldFromModel', icosahedronWorld.elements);
  shaderProgram.setUniform3f('albedo', 1.0, 0.5, 0.1);
  shaderProgram.setUniform1f('ambientFactor', 0.6);
  shaderProgram.setUniform1f('shininess', 100.0);
  shaderProgram.setUniform1f('alpha', 0.85);
  icosahedronVao.bind();
  icosahedronVao.drawIndexed(gl.TRIANGLES);
  icosahedronVao.unbind();

  // Restore settings for opaque objects
  gl.disable(gl.BLEND);
  gl.depthMask(true);

  // Render edges (black wireframe) with unlit shader - disable depth test so they always show on top
  gl.disable(gl.DEPTH_TEST);
  unlitProgram.bind();
  unlitProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
  unlitProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);
  unlitProgram.setUniformMatrix4fv('worldFromModel', icosahedronWorld.elements);
  gl.uniform4f(gl.getUniformLocation(unlitProgram.program, 'color'), 0.0, 0.0, 0.0, 1.0);
  edgesVao.bind();
  gl.drawArrays(gl.LINES, 0, edgeCount);
  edgesVao.unbind();
  gl.enable(gl.DEPTH_TEST);
  shaderProgram.bind(); // Switch back to main shader

  // Apply trackball rotation to rays and points
  const worldFromModel = trackball.rotater;

  // Render rays first (black cylinders)
  shaderProgram.setUniform3f('albedo', 0.0, 0.0, 0.0);
  shaderProgram.setUniform1f('ambientFactor', 0.3);
  shaderProgram.setUniform1f('shininess', 30.0);
  shaderProgram.setUniform1f('alpha', 1.0);

  rayVao.bind();
  for (const ray of rays) {
    const rayVector = ray.end.subtract(ray.start);
    const rayLength = rayVector.magnitude;
    
    if (rayLength < 0.001) continue;
    
    const up = new Vector3(0, 1, 0);
    const rayDir = rayVector.normalize();
    
    const rotationAxis = up.cross(rayDir);
    const rotationAngle = Math.acos(Math.max(-1, Math.min(1, up.dot(rayDir)))) * 180 / Math.PI;
    
    let modelFromCylinder: Matrix4;
    if (rotationAxis.magnitude > 0.001) {
      modelFromCylinder = Matrix4.translate(ray.start.x, ray.start.y, ray.start.z)
        .multiplyMatrix(Matrix4.rotateAround(rotationAxis.normalize(), rotationAngle))
        .multiplyMatrix(Matrix4.scale(1, rayLength, 1));
    } else {
      if (rayDir.y < 0) {
        modelFromCylinder = Matrix4.translate(ray.start.x, ray.start.y, ray.start.z)
          .multiplyMatrix(Matrix4.rotateX(180))
          .multiplyMatrix(Matrix4.scale(1, rayLength, 1));
      } else {
        modelFromCylinder = Matrix4.translate(ray.start.x, ray.start.y, ray.start.z)
          .multiplyMatrix(Matrix4.scale(1, rayLength, 1));
      }
    }
    
    const worldFromCylinder = worldFromModel.multiplyMatrix(modelFromCylinder);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromCylinder.elements);
    rayVao.drawIndexed(gl.TRIANGLES);
  }
  rayVao.unbind();

  // Clear depth buffer before rendering intersection points
  gl.clear(gl.DEPTH_BUFFER_BIT);
  
  // Render intersection points last (red spheres)
  shaderProgram.setUniform3f('albedo', 1.0, 0.0, 0.0);
  shaderProgram.setUniform1f('ambientFactor', 0.5);
  shaderProgram.setUniform1f('shininess', 50.0);
  shaderProgram.setUniform1f('alpha', 1.0);

  intersectionVao.bind();
  for (const point of intersectionPoints) {
    const modelFromPoint = Matrix4.translate(point.x, point.y, point.z);
    const worldFromPoint = worldFromModel.multiplyMatrix(modelFromPoint);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromPoint.elements);
    intersectionVao.drawIndexed(gl.TRIANGLES);
  }
  intersectionVao.unbind();

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
  eyeFromWorld = Matrix4.translate(0, 0, -cameraDistance);
  
  // Compute inverse matrices
  worldFromEye = eyeFromWorld.inverse();
  eyeFromClip = clipFromEye.inverse();

  // Calculate the icosahedron's size in pixels
  const icosahedronWorldRadius = 1.0;
  const fovRadians = fovY * Math.PI / 180;
  const viewportHeight = 2 * cameraDistance * Math.tan(fovRadians / 2);
  const pixelsPerUnit = canvas.height / viewportHeight;
  const icosahedronRadiusPixels = icosahedronWorldRadius * pixelsPerUnit;
  
  trackball.setViewport(canvas.width, canvas.height, icosahedronRadiusPixels);

  render();
}

window.addEventListener('load', () => initialize());
