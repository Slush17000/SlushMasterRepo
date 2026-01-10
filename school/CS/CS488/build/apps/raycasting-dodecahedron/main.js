import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Prefab } from 'lib/prefab.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3, Vector4 } from 'lib/vector.js';
import { Trackball } from 'lib/trackball.js';
import { intersectRayDodecahedron } from 'lib/intersect.js';
import { Trimesh } from 'lib/trimesh.js';
let canvas;
let shaderProgram;
let unlitProgram; // Shader for unlit edges
let clipFromEye;
let eyeFromWorld;
let worldFromEye;
let eyeFromClip;
// VAOs for different objects
let dodecahedronVao;
let edgesVao;
let edgeCount;
let intersectionVao;
let rayVao;
let trackball;
let lightPosition = new Vector3(0, 5, 5);
// Store intersection points and rays
let intersectionPoints = [];
let rays = [];
// Track dragging state
let isDragging = false;
// Camera distance for zooming
let cameraDistance = 5.0;
// Dodecahedron properties
const size = 2.0;
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    const unlitVertexSource = await fetchText('unlit-vertex.glsl');
    const unlitFragmentSource = await fetchText('unlit-fragment.glsl');
    unlitProgram = new ShaderProgram(unlitVertexSource, unlitFragmentSource);
    // Create dodecahedron manually
    const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
    const scale = size / (2 * phi);
    const dodecahedronVertices = [
        // (±1, ±1, ±1)
        new Vector3(1, 1, 1).multiplyScalar(scale),
        new Vector3(1, 1, -1).multiplyScalar(scale),
        new Vector3(1, -1, 1).multiplyScalar(scale),
        new Vector3(1, -1, -1).multiplyScalar(scale),
        new Vector3(-1, 1, 1).multiplyScalar(scale),
        new Vector3(-1, 1, -1).multiplyScalar(scale),
        new Vector3(-1, -1, 1).multiplyScalar(scale),
        new Vector3(-1, -1, -1).multiplyScalar(scale),
        // (0, ±1/φ, ±φ)
        new Vector3(0, 1 / phi, phi).multiplyScalar(scale),
        new Vector3(0, 1 / phi, -phi).multiplyScalar(scale),
        new Vector3(0, -1 / phi, phi).multiplyScalar(scale),
        new Vector3(0, -1 / phi, -phi).multiplyScalar(scale),
        // (±1/φ, ±φ, 0)
        new Vector3(1 / phi, phi, 0).multiplyScalar(scale),
        new Vector3(1 / phi, -phi, 0).multiplyScalar(scale),
        new Vector3(-1 / phi, phi, 0).multiplyScalar(scale),
        new Vector3(-1 / phi, -phi, 0).multiplyScalar(scale),
        // (±φ, 0, ±1/φ)
        new Vector3(phi, 0, 1 / phi).multiplyScalar(scale),
        new Vector3(phi, 0, -1 / phi).multiplyScalar(scale),
        new Vector3(-phi, 0, 1 / phi).multiplyScalar(scale),
        new Vector3(-phi, 0, -1 / phi).multiplyScalar(scale)
    ];
    // 12 pentagonal faces - standard dodecahedron topology
    const pentagonalFaces = [
        [0, 8, 10, 2, 16],
        [0, 12, 14, 4, 8],
        [0, 16, 17, 1, 12],
        [1, 9, 5, 14, 12],
        [1, 17, 3, 11, 9],
        [2, 10, 6, 15, 13],
        [2, 13, 3, 17, 16],
        [3, 13, 15, 7, 11],
        [4, 14, 5, 19, 18],
        [4, 18, 6, 10, 8],
        [5, 9, 11, 7, 19],
        [6, 18, 19, 7, 15]
    ];
    // Convert pentagon faces to triangles with consistent winding
    const dodecahedronFaces = [];
    for (const face of pentagonalFaces) {
        // Fan triangulation from first vertex
        dodecahedronFaces.push([face[0], face[1], face[2]]);
        dodecahedronFaces.push([face[0], face[2], face[3]]);
        dodecahedronFaces.push([face[0], face[3], face[4]]);
    }
    const dodecahedronMesh = new Trimesh(dodecahedronVertices, dodecahedronFaces);
    dodecahedronMesh.computeNormals();
    const dodecahedronAttributes = new VertexAttributes();
    dodecahedronAttributes.addAttribute('position', dodecahedronMesh.vertexCount, 3, dodecahedronMesh.positionBuffer);
    dodecahedronAttributes.addAttribute('normal', dodecahedronMesh.vertexCount, 3, dodecahedronMesh.normalBuffer);
    dodecahedronAttributes.addIndices(dodecahedronMesh.faceBuffer);
    dodecahedronVao = new VertexArray(shaderProgram, dodecahedronAttributes);
    // Create edges for wireframe
    const edges = [];
    const edgeSet = new Set();
    for (const face of pentagonalFaces) {
        for (let i = 0; i < face.length; i++) {
            const v1 = face[i];
            const v2 = face[(i + 1) % face.length];
            const edgeKey = v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
            if (!edgeSet.has(edgeKey)) {
                edgeSet.add(edgeKey);
                edges.push(v1, v2);
            }
        }
    }
    const edgePositions = [];
    for (let i = 0; i < edges.length; i++) {
        const vertex = dodecahedronVertices[edges[i]];
        edgePositions.push(vertex.x, vertex.y, vertex.z);
    }
    edgeCount = edgePositions.length / 3;
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
function onPointerDown(event) {
    isDragging = false;
    trackball.start(new Vector3(event.clientX, event.clientY, 0));
    canvas.setPointerCapture(event.pointerId);
}
function onPointerMove(event) {
    if (canvas.hasPointerCapture(event.pointerId)) {
        isDragging = true;
        trackball.drag(new Vector3(event.clientX, event.clientY, 0));
        render();
    }
}
function onPointerUp(event) {
    if (canvas.hasPointerCapture(event.pointerId)) {
        trackball.end();
        canvas.releasePointerCapture(event.pointerId);
        setTimeout(() => { isDragging = false; }, 0);
    }
}
function onPointerCancel(event) {
    if (canvas.hasPointerCapture(event.pointerId)) {
        trackball.cancel();
        canvas.releasePointerCapture(event.pointerId);
        isDragging = false;
    }
}
function onWheel(event) {
    event.preventDefault();
    const zoomSpeed = 0.001;
    cameraDistance += event.deltaY * zoomSpeed;
    cameraDistance = Math.max(2.0, Math.min(20.0, cameraDistance));
    resizeCanvas();
}
function onMouseClick(event) {
    if (isDragging) {
        isDragging = false;
        return;
    }
    // Convert mouse pixel coordinates to normalized device coordinates
    const mousePixel = new Vector4(event.clientX, canvas.height - 1 - event.clientY, 0, 1);
    const mouseNormalized = new Vector4(mousePixel.x / canvas.width * 2 - 1, mousePixel.y / canvas.height * 2 - 1, -1, 1);
    // Transform from clip space to eye space (near plane)
    let mouseEye = eyeFromClip.multiplyVector4(mouseNormalized);
    mouseEye = mouseEye.divideScalar(mouseEye.w);
    // Transform from eye space to world space
    const mouseWorld = worldFromEye.multiplyVector4(mouseEye);
    const rayStart = new Vector3(mouseWorld.x, mouseWorld.y, mouseWorld.z);
    // Find the end point on the far clipping plane
    const mouseNormalizedFar = new Vector4(mousePixel.x / canvas.width * 2 - 1, mousePixel.y / canvas.height * 2 - 1, 1, 1);
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
    // Find intersections with the dodecahedron in model space
    const intersections = intersectRayDodecahedron(rayStartModel, rayDirectionModel, size);
    if (intersections.length > 0) {
        // Store the ray segment in model space
        if (intersections.length === 2) {
            rays.push({
                start: intersections[0],
                end: intersections[1]
            });
        }
        else if (intersections.length === 1) {
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
    // Enable blending for semi-transparent dodecahedron
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    // Render main dodecahedron (semi-transparent teal/turquoise)
    const dodecahedronWorld = trackball.rotater;
    shaderProgram.setUniformMatrix4fv('worldFromModel', dodecahedronWorld.elements);
    shaderProgram.setUniform3f('albedo', 0.9, 0.2, 0.2);
    shaderProgram.setUniform1f('ambientFactor', 0.6);
    shaderProgram.setUniform1f('shininess', 100.0);
    shaderProgram.setUniform1f('alpha', 0.85);
    dodecahedronVao.bind();
    dodecahedronVao.drawIndexed(gl.TRIANGLES);
    dodecahedronVao.unbind();
    // Restore settings for opaque objects
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    // Render edges (black wireframe) - disable depth test so they always show on top
    gl.disable(gl.DEPTH_TEST);
    unlitProgram.bind();
    unlitProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    unlitProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);
    unlitProgram.setUniformMatrix4fv('worldFromModel', dodecahedronWorld.elements);
    gl.uniform4f(gl.getUniformLocation(unlitProgram.program, 'color'), 0.0, 0.0, 0.0, 1.0);
    edgesVao.bind();
    gl.drawArrays(gl.LINES, 0, edgeCount);
    edgesVao.unbind();
    gl.enable(gl.DEPTH_TEST);
    shaderProgram.bind();
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
        if (rayLength < 0.001)
            continue;
        const up = new Vector3(0, 1, 0);
        const rayDir = rayVector.normalize();
        const rotationAxis = up.cross(rayDir);
        const rotationAngle = Math.acos(Math.max(-1, Math.min(1, up.dot(rayDir)))) * 180 / Math.PI;
        let modelFromCylinder;
        if (rotationAxis.magnitude > 0.001) {
            modelFromCylinder = Matrix4.translate(ray.start.x, ray.start.y, ray.start.z)
                .multiplyMatrix(Matrix4.rotateAround(rotationAxis.normalize(), rotationAngle))
                .multiplyMatrix(Matrix4.scale(1, rayLength, 1));
        }
        else {
            if (rayDir.y < 0) {
                modelFromCylinder = Matrix4.translate(ray.start.x, ray.start.y, ray.start.z)
                    .multiplyMatrix(Matrix4.rotateX(180))
                    .multiplyMatrix(Matrix4.scale(1, rayLength, 1));
            }
            else {
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
    // Calculate the dodecahedron's size in pixels
    const dodecahedronWorldRadius = 1.0;
    const fovRadians = fovY * Math.PI / 180;
    const viewportHeight = 2 * cameraDistance * Math.tan(fovRadians / 2);
    const pixelsPerUnit = canvas.height / viewportHeight;
    const dodecahedronRadiusPixels = dodecahedronWorldRadius * pixelsPerUnit;
    trackball.setViewport(canvas.width, canvas.height, dodecahedronRadiusPixels);
    render();
}
window.addEventListener('load', () => initialize());
