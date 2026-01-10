import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3 } from 'lib/vector.js';
import { Trackball } from 'lib/trackball.js';
let canvas;
let shaderProgram2D;
let shaderProgram3D;
let vao;
let currentLevel = 5;
let is3DMode = false;
// 3D-specific variables
let clipFromEye;
let eyeFromWorld;
let trackball;
let lightPosition = new Vector3(5, 5, 5);
let cameraDistance = 2.5;
let isDragging = false;
/**
 * Generates vertices for a 2D Sierpinski triangle at the specified recursion level.
 * @param level - The recursion depth (1-10)
 * @returns Float32Array of vertex positions
 */
function generateSierpinski2D(level) {
    const triangles = [];
    // Define the initial large triangle vertices (equilateral triangle)
    // Lowered by 0.15 units
    const initialTriangle = [
        0.0, 0.716, 0.0, // Top vertex (was 0.866)
        -0.866, -0.65, 0.0, // Bottom left vertex (was -0.5)
        0.866, -0.65, 0.0 // Bottom right vertex (was -0.5)
    ];
    // Recursive function to subdivide triangles
    function subdivide(vertices, depth) {
        if (depth === 0) {
            // Base case: add the triangle to our list
            triangles.push(...vertices);
        }
        else {
            // Calculate midpoints
            const x1 = vertices[0], y1 = vertices[1], z1 = vertices[2];
            const x2 = vertices[3], y2 = vertices[4], z2 = vertices[5];
            const x3 = vertices[6], y3 = vertices[7], z3 = vertices[8];
            const mid1x = (x1 + x2) / 2, mid1y = (y1 + y2) / 2, mid1z = (z1 + z2) / 2;
            const mid2x = (x2 + x3) / 2, mid2y = (y2 + y3) / 2, mid2z = (z2 + z3) / 2;
            const mid3x = (x3 + x1) / 2, mid3y = (y3 + y1) / 2, mid3z = (z3 + z1) / 2;
            // Recursively subdivide the three corner triangles
            subdivide([
                x1, y1, z1,
                mid1x, mid1y, mid1z,
                mid3x, mid3y, mid3z
            ], depth - 1);
            subdivide([
                mid1x, mid1y, mid1z,
                x2, y2, z2,
                mid2x, mid2y, mid2z
            ], depth - 1);
            subdivide([
                mid3x, mid3y, mid3z,
                mid2x, mid2y, mid2z,
                x3, y3, z3
            ], depth - 1);
        }
    }
    // Start the recursion
    subdivide(initialTriangle, level - 1);
    return new Float32Array(triangles);
}
/**
 * Generates a 3D Sierpinski tetrahedron (tetrix) at the specified recursion level.
 * Returns raw vertex and normal data without using indices.
 * @param level - The recursion depth (1-10)
 * @returns Object with positions and normals as Float32Arrays
 */
function generateSierpinski3D(level) {
    const vertices = [];
    const normals = [];
    // Define the initial tetrahedron vertices
    const size = 1.0;
    const h = size * Math.sqrt(2 / 3);
    const r = size * Math.sqrt(3) / 3;
    // Create vertices centered at origin
    // Calculate centroid and offset vertices
    const v0 = new Vector3(0, h / 2, 0);
    const v1 = new Vector3(r, -h / 2, 0);
    const v2 = new Vector3(-r / 2, -h / 2, r * Math.sqrt(3) / 2);
    const v3 = new Vector3(-r / 2, -h / 2, -r * Math.sqrt(3) / 2);
    // Calculate centroid (center of mass) of the tetrahedron
    const centroid = v0.add(v1).add(v2).add(v3).multiplyScalar(0.25);
    // Offset all vertices to center the tetrahedron at origin
    const initialVertices = [
        v0.subtract(centroid),
        v1.subtract(centroid),
        v2.subtract(centroid),
        v3.subtract(centroid)
    ];
    // Helper function to add a triangle with calculated normal
    function addTriangle(v0, v1, v2) {
        // Calculate face normal
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const normal = edge1.cross(edge2).normalize();
        // Add vertices and normals (same normal for all three vertices of the triangle)
        vertices.push(v0.x, v0.y, v0.z);
        normals.push(normal.x, normal.y, normal.z);
        vertices.push(v1.x, v1.y, v1.z);
        normals.push(normal.x, normal.y, normal.z);
        vertices.push(v2.x, v2.y, v2.z);
        normals.push(normal.x, normal.y, normal.z);
    }
    // Recursive function to subdivide tetrahedra
    function subdivide(v0, v1, v2, v3, depth) {
        if (depth === 0) {
            // Base case: add the four faces of the tetrahedron
            addTriangle(v0, v2, v1); // face 1
            addTriangle(v0, v3, v2); // face 2
            addTriangle(v0, v1, v3); // face 3
            addTriangle(v1, v2, v3); // base
        }
        else {
            // Calculate midpoints
            const mid01 = v0.add(v1).multiplyScalar(0.5);
            const mid02 = v0.add(v2).multiplyScalar(0.5);
            const mid03 = v0.add(v3).multiplyScalar(0.5);
            const mid12 = v1.add(v2).multiplyScalar(0.5);
            const mid13 = v1.add(v3).multiplyScalar(0.5);
            const mid23 = v2.add(v3).multiplyScalar(0.5);
            // Recursively subdivide the four corner tetrahedra
            subdivide(v0, mid01, mid02, mid03, depth - 1);
            subdivide(mid01, v1, mid12, mid13, depth - 1);
            subdivide(mid02, mid12, v2, mid23, depth - 1);
            subdivide(mid03, mid13, mid23, v3, depth - 1);
        }
    }
    // Start the recursion
    subdivide(initialVertices[0], initialVertices[1], initialVertices[2], initialVertices[3], level - 1);
    return {
        positions: new Float32Array(vertices),
        normals: new Float32Array(normals),
        vertexCount: vertices.length / 3
    };
}
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    // Load shaders for 2D
    const vertexSource2D = await fetchText('flat-vertex.glsl');
    const fragmentSource2D = await fetchText('flat-fragment.glsl');
    shaderProgram2D = new ShaderProgram(vertexSource2D, fragmentSource2D);
    // Load shaders for 3D
    const vertexSource3D = await fetchText('3d-vertex.glsl');
    const fragmentSource3D = await fetchText('3d-fragment.glsl');
    shaderProgram3D = new ShaderProgram(vertexSource3D, fragmentSource3D);
    // Initialize trackball
    trackball = new Trackball(1.0);
    // Set up event listeners
    const levelInput = document.getElementById('level');
    const levelDisplay = document.getElementById('level-display');
    const btn2D = document.getElementById('btn-2d');
    const btn3D = document.getElementById('btn-3d');
    levelInput.addEventListener('input', () => {
        currentLevel = parseInt(levelInput.value);
        levelDisplay.textContent = `Level: ${currentLevel}`;
        updateGeometry();
        render();
    });
    btn2D.addEventListener('click', () => {
        if (!is3DMode)
            return;
        is3DMode = false;
        btn2D.classList.add('active');
        btn3D.classList.remove('active');
        updateGeometry();
        render();
    });
    btn3D.addEventListener('click', () => {
        if (is3DMode)
            return;
        is3DMode = true;
        btn3D.classList.add('active');
        btn2D.classList.remove('active');
        updateGeometry();
        resizeCanvas();
    });
    // Mouse/trackball controls for 3D mode
    canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
    canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
    canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
    canvas.addEventListener('pointercancel', (ev) => onPointerCancel(ev));
    canvas.addEventListener('wheel', (ev) => onWheel(ev), { passive: false });
    window.addEventListener('resize', () => resizeCanvas());
    // Initial setup - initialize 3D matrices even if starting in 2D mode
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    const fovY = 45;
    const near = 0.1;
    const far = 100;
    clipFromEye = Matrix4.perspective(fovY, aspectRatio, near, far);
    eyeFromWorld = Matrix4.translate(0, 0, -cameraDistance);
    updateGeometry();
    resizeCanvas();
}
function onPointerDown(event) {
    if (!is3DMode)
        return;
    isDragging = false;
    trackball.start(new Vector3(event.clientX, event.clientY, 0));
    canvas.setPointerCapture(event.pointerId);
}
function onPointerMove(event) {
    if (!is3DMode)
        return;
    if (canvas.hasPointerCapture(event.pointerId)) {
        isDragging = true;
        trackball.drag(new Vector3(event.clientX, event.clientY, 0));
        render();
    }
}
function onPointerUp(event) {
    if (!is3DMode)
        return;
    if (canvas.hasPointerCapture(event.pointerId)) {
        trackball.end();
        canvas.releasePointerCapture(event.pointerId);
        setTimeout(() => { isDragging = false; }, 0);
    }
}
function onPointerCancel(event) {
    if (!is3DMode)
        return;
    if (canvas.hasPointerCapture(event.pointerId)) {
        trackball.cancel();
        canvas.releasePointerCapture(event.pointerId);
        isDragging = false;
    }
}
function onWheel(event) {
    if (!is3DMode)
        return;
    event.preventDefault();
    const zoomSpeed = 0.001;
    cameraDistance += event.deltaY * zoomSpeed;
    cameraDistance = Math.max(1.5, Math.min(10.0, cameraDistance));
    resizeCanvas();
}
function updateGeometry() {
    if (is3DMode) {
        // Generate 3D Sierpinski tetrahedron
        const mesh = generateSierpinski3D(currentLevel);
        const attributes = new VertexAttributes();
        attributes.addAttribute('position', mesh.vertexCount, 3, mesh.positions);
        attributes.addAttribute('normal', mesh.vertexCount, 3, mesh.normals);
        vao = new VertexArray(shaderProgram3D, attributes);
    }
    else {
        // Generate 2D Sierpinski triangle
        const positions = generateSierpinski2D(currentLevel);
        const vertexCount = positions.length / 3;
        const attributes = new VertexAttributes();
        attributes.addAttribute('position', vertexCount, 3, positions);
        vao = new VertexArray(shaderProgram2D, attributes);
    }
}
function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Black background
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    if (is3DMode) {
        render3D();
    }
    else {
        render2D();
    }
}
function render2D() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    shaderProgram2D.bind();
    // Set aspect ratio uniform
    const aspectRatio = canvas.width / canvas.height;
    shaderProgram2D.setUniform1f('aspectRatio', aspectRatio);
    vao.bind();
    vao.drawSequence(gl.TRIANGLES);
    vao.unbind();
    shaderProgram2D.unbind();
}
function render3D() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    shaderProgram3D.bind();
    // Transform light to eye space
    const lightPositionEye = eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram3D.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
    shaderProgram3D.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
    shaderProgram3D.setUniform3f('specularColor', 0.5, 0.5, 0.5);
    // Upload transformation matrices
    shaderProgram3D.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram3D.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);
    // Set up the tetrahedron transformation (apply trackball rotation)
    const worldFromModel = trackball.rotater;
    shaderProgram3D.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);
    shaderProgram3D.setUniform3f('albedo', 1.0, 1.0, 1.0); // White
    shaderProgram3D.setUniform1f('ambientFactor', 0.3);
    shaderProgram3D.setUniform1f('shininess', 50.0);
    shaderProgram3D.setUniform1f('alpha', 1.0);
    vao.bind();
    vao.drawSequence(gl.TRIANGLES);
    vao.unbind();
    shaderProgram3D.unbind();
    gl.disable(gl.CULL_FACE);
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    if (is3DMode) {
        const aspectRatio = canvas.clientWidth / canvas.clientHeight;
        const fovY = 45;
        const near = 0.1;
        const far = 100;
        clipFromEye = Matrix4.perspective(fovY, aspectRatio, near, far);
        eyeFromWorld = Matrix4.translate(0, 0, -cameraDistance);
        // Calculate the tetrahedron's size in pixels for trackball
        const tetrahedronWorldRadius = 1.0;
        const fovRadians = fovY * Math.PI / 180;
        const viewportHeight = 2 * cameraDistance * Math.tan(fovRadians / 2);
        const pixelsPerUnit = canvas.height / viewportHeight;
        const tetrahedronRadiusPixels = tetrahedronWorldRadius * pixelsPerUnit;
        trackball.setViewport(canvas.width, canvas.height, tetrahedronRadiusPixels);
    }
    render();
}
window.addEventListener('load', () => initialize());
