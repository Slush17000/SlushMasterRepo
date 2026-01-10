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
let currentLevel = 3;
let is3DMode = false;
// 3D-specific variables
let clipFromEye;
let eyeFromWorld;
let trackball;
let lightPosition = new Vector3(5, 5, 5);
let cameraDistance = 3.0;
let isDragging = false;
/**
 * Generates vertices for a 2D Menger Sponge (Sierpinski Carpet) at the specified recursion level.
 * @param level - The recursion depth (1-5)
 * @returns Float32Array of vertex positions
 */
function generateMenger2D(level) {
    const squares = [];
    // Helper function to add a square (two triangles)
    function addSquare(x, y, size) {
        const halfSize = size / 2;
        const x1 = x - halfSize;
        const x2 = x + halfSize;
        const y1 = y - halfSize;
        const y2 = y + halfSize;
        // Triangle 1
        squares.push(x1, y1, 0.0);
        squares.push(x2, y1, 0.0);
        squares.push(x2, y2, 0.0);
        // Triangle 2
        squares.push(x1, y1, 0.0);
        squares.push(x2, y2, 0.0);
        squares.push(x1, y2, 0.0);
    }
    // Recursive function to subdivide squares
    function subdivide(x, y, size, depth) {
        if (depth === 0) {
            // Base case: add the square
            addSquare(x, y, size);
        }
        else {
            // Divide into 9 sub-squares, skip the center one
            const newSize = size / 3;
            const offset = size / 3;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    // Skip the center square
                    if (i === 0 && j === 0)
                        continue;
                    subdivide(x + i * offset, y + j * offset, newSize, depth - 1);
                }
            }
        }
    }
    // Start with a square centered at origin, size 1.5 (slightly lowered)
    subdivide(0, -0.1, 1.5, level - 1);
    return new Float32Array(squares);
}
/**
 * Generates a 3D Menger Sponge at the specified recursion level.
 * Returns raw vertex and normal data without using indices.
 * @param level - The recursion depth (1-5)
 * @returns Object with positions and normals as Float32Arrays
 */
function generateMenger3D(level) {
    const vertices = [];
    const normals = [];
    // Helper function to add a cube face (two triangles)
    function addFace(v0, v1, v2, v3) {
        // Calculate face normal
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const normal = edge1.cross(edge2).normalize();
        // Triangle 1
        vertices.push(v0.x, v0.y, v0.z);
        normals.push(normal.x, normal.y, normal.z);
        vertices.push(v1.x, v1.y, v1.z);
        normals.push(normal.x, normal.y, normal.z);
        vertices.push(v2.x, v2.y, v2.z);
        normals.push(normal.x, normal.y, normal.z);
        // Triangle 2
        vertices.push(v0.x, v0.y, v0.z);
        normals.push(normal.x, normal.y, normal.z);
        vertices.push(v2.x, v2.y, v2.z);
        normals.push(normal.x, normal.y, normal.z);
        vertices.push(v3.x, v3.y, v3.z);
        normals.push(normal.x, normal.y, normal.z);
    }
    // Helper function to add a cube
    function addCube(x, y, z, size) {
        const halfSize = size / 2;
        // Define 8 vertices of the cube
        const v000 = new Vector3(x - halfSize, y - halfSize, z - halfSize);
        const v001 = new Vector3(x - halfSize, y - halfSize, z + halfSize);
        const v010 = new Vector3(x - halfSize, y + halfSize, z - halfSize);
        const v011 = new Vector3(x - halfSize, y + halfSize, z + halfSize);
        const v100 = new Vector3(x + halfSize, y - halfSize, z - halfSize);
        const v101 = new Vector3(x + halfSize, y - halfSize, z + halfSize);
        const v110 = new Vector3(x + halfSize, y + halfSize, z - halfSize);
        const v111 = new Vector3(x + halfSize, y + halfSize, z + halfSize);
        // Add 6 faces (reversed winding for outward-facing normals)
        addFace(v010, v110, v100, v000); // Front (-Z)
        addFace(v111, v011, v001, v101); // Back (+Z)
        addFace(v011, v010, v000, v001); // Left (-X)
        addFace(v110, v111, v101, v100); // Right (+X)
        addFace(v011, v111, v110, v010); // Top (+Y)
        addFace(v000, v100, v101, v001); // Bottom (-Y)
    }
    // Recursive function to subdivide cubes
    function subdivide(x, y, z, size, depth) {
        if (depth === 0) {
            // Base case: add the cube
            addCube(x, y, z, size);
        }
        else {
            // Divide into 27 sub-cubes, skip the center ones (7 total to skip)
            const newSize = size / 3;
            const offset = size / 3;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    for (let k = -1; k <= 1; k++) {
                        // Skip the center cube and the cross pattern through the center
                        const centerCount = (i === 0 ? 1 : 0) + (j === 0 ? 1 : 0) + (k === 0 ? 1 : 0);
                        if (centerCount >= 2)
                            continue;
                        subdivide(x + i * offset, y + j * offset, z + k * offset, newSize, depth - 1);
                    }
                }
            }
        }
    }
    // Start with a cube centered at origin
    subdivide(0, 0, 0, 1.0, level - 1);
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
        // Generate 3D Menger Sponge
        const mesh = generateMenger3D(currentLevel);
        const attributes = new VertexAttributes();
        attributes.addAttribute('position', mesh.vertexCount, 3, mesh.positions);
        attributes.addAttribute('normal', mesh.vertexCount, 3, mesh.normals);
        vao = new VertexArray(shaderProgram3D, attributes);
    }
    else {
        // Generate 2D Menger Sponge (Sierpinski Carpet)
        const positions = generateMenger2D(currentLevel);
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
    // Set up the sponge transformation (apply trackball rotation)
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
        // Calculate the sponge's size in pixels for trackball
        const spongeWorldRadius = 1.0;
        const fovRadians = fovY * Math.PI / 180;
        const viewportHeight = 2 * cameraDistance * Math.tan(fovRadians / 2);
        const pixelsPerUnit = canvas.height / viewportHeight;
        const spongeRadiusPixels = spongeWorldRadius * pixelsPerUnit;
        trackball.setViewport(canvas.width, canvas.height, spongeRadiusPixels);
    }
    render();
}
window.addEventListener('load', () => initialize());
