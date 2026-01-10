import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Prefab } from 'lib/prefab.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3, Vector4 } from 'lib/vector.js';
import { Trackball } from 'lib/trackball.js';
import { intersectRayBox } from 'lib/intersect.js';
import { Trimesh } from 'lib/trimesh.js';
let canvas;
let shaderProgram;
let unlitProgram; // Shader for unlit edges
let clipFromEye;
let eyeFromWorld;
let worldFromEye;
let eyeFromClip;
// VAOs for different objects
let boxVao;
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
// Box properties (centered cube from -1 to 1)
const boxMin = new Vector3(-1, -1, -1);
const boxMax = new Vector3(1, 1, 1);
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    const unlitVertexSource = await fetchText('unlit-vertex.glsl');
    const unlitFragmentSource = await fetchText('unlit-fragment.glsl');
    unlitProgram = new ShaderProgram(unlitVertexSource, unlitFragmentSource);
    // Create main box (cube) manually
    const boxPositions = [
        // Front face
        new Vector3(-1, -1, 1), new Vector3(1, -1, 1), new Vector3(1, 1, 1), new Vector3(-1, 1, 1),
        // Back face
        new Vector3(-1, -1, -1), new Vector3(-1, 1, -1), new Vector3(1, 1, -1), new Vector3(1, -1, -1),
        // Top face
        new Vector3(-1, 1, -1), new Vector3(-1, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, -1),
        // Bottom face
        new Vector3(-1, -1, -1), new Vector3(1, -1, -1), new Vector3(1, -1, 1), new Vector3(-1, -1, 1),
        // Right face
        new Vector3(1, -1, -1), new Vector3(1, 1, -1), new Vector3(1, 1, 1), new Vector3(1, -1, 1),
        // Left face
        new Vector3(-1, -1, -1), new Vector3(-1, -1, 1), new Vector3(-1, 1, 1), new Vector3(-1, 1, -1)
    ];
    const boxFaces = [
        // Front face
        [0, 1, 2], [0, 2, 3],
        // Back face
        [4, 5, 6], [4, 6, 7],
        // Top face
        [8, 9, 10], [8, 10, 11],
        // Bottom face
        [12, 13, 14], [12, 14, 15],
        // Right face
        [16, 17, 18], [16, 18, 19],
        // Left face
        [20, 21, 22], [20, 22, 23]
    ];
    const boxMesh = new Trimesh(boxPositions, boxFaces);
    boxMesh.computeNormals();
    const boxAttributes = new VertexAttributes();
    boxAttributes.addAttribute('position', boxMesh.vertexCount, 3, boxMesh.positionBuffer);
    boxAttributes.addAttribute('normal', boxMesh.vertexCount, 3, boxMesh.normalBuffer);
    boxAttributes.addIndices(boxMesh.faceBuffer);
    boxVao = new VertexArray(shaderProgram, boxAttributes);
    // Create edges for wireframe (12 edges of a cube)
    const cubeEdges = [
        // Bottom square
        0, 1, 1, 2, 2, 3, 3, 0,
        // Top square
        4, 5, 5, 6, 6, 7, 7, 4,
        // Vertical edges
        0, 4, 1, 7, 2, 6, 3, 5
    ];
    const cubeVertices = [
        new Vector3(-1, -1, -1), new Vector3(1, -1, -1),
        new Vector3(1, 1, -1), new Vector3(-1, 1, -1),
        new Vector3(-1, -1, 1), new Vector3(-1, 1, 1),
        new Vector3(1, 1, 1), new Vector3(1, -1, 1)
    ];
    const edgePositions = [];
    for (let i = 0; i < cubeEdges.length; i++) {
        const vertex = cubeVertices[cubeEdges[i]];
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
    // Initialize trackball (use box size for radius)
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
    // Find intersections with the box in model space
    const intersections = intersectRayBox(rayStartModel, rayDirectionModel, boxMin, boxMax);
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
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
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
    // Enable blending for semi-transparent box
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    // Render main box (semi-transparent green)
    const boxWorld = trackball.rotater;
    shaderProgram.setUniformMatrix4fv('worldFromModel', boxWorld.elements);
    shaderProgram.setUniform3f('albedo', 0.2, 0.6, 0.3);
    shaderProgram.setUniform1f('ambientFactor', 0.4);
    shaderProgram.setUniform1f('shininess', 100.0);
    shaderProgram.setUniform1f('alpha', 0.85);
    boxVao.bind();
    boxVao.drawIndexed(gl.TRIANGLES);
    boxVao.unbind();
    // Restore settings for opaque objects
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    // Render edges (black wireframe) - disable depth test so they always show on top
    gl.disable(gl.DEPTH_TEST);
    unlitProgram.bind();
    unlitProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    unlitProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);
    unlitProgram.setUniformMatrix4fv('worldFromModel', boxWorld.elements);
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
    // Calculate the box's size in pixels
    const boxWorldRadius = 1.0;
    const fovRadians = fovY * Math.PI / 180;
    const viewportHeight = 2 * cameraDistance * Math.tan(fovRadians / 2);
    const pixelsPerUnit = canvas.height / viewportHeight;
    const boxRadiusPixels = boxWorldRadius * pixelsPerUnit;
    trackball.setViewport(canvas.width, canvas.height, boxRadiusPixels);
    render();
}
window.addEventListener('load', () => initialize());
