import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3 } from 'lib/vector.js';
let canvas;
let shaderProgram;
let vao;
let clipFromWorld;
let rotationMatrix;
let modelCentroid;
let modelRadius;
let zoomFactor = 3;
let currentModelPath;
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    // Load initial model
    currentModelPath = './models/pyramid.txt';
    await loadAndDisplayModel(currentModelPath);
    rotationMatrix = Matrix4.identity();
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('wheel', handleWheel);
    setupModelButtons();
    resizeCanvas();
    render();
}
async function loadAndDisplayModel(modelPath) {
    console.log('Loading model from:', modelPath);
    const boxes = await loadModel(modelPath);
    console.log('Loaded boxes:', boxes.length);
    // Calculate centroid and radius for the model
    calculateModelBounds(boxes);
    // Create mesh from boxes
    const { positions, colors, indices } = createBoxelMesh(boxes);
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', positions.length / 3, 3, positions);
    attributes.addAttribute('color', colors.length / 3, 3, colors);
    attributes.addIndices(indices);
    // Dispose of old VAO if it exists
    if (vao) {
        vao.unbind();
    }
    vao = new VertexArray(shaderProgram, attributes);
    // Reset zoom and rotation when switching models
    zoomFactor = 3;
    rotationMatrix = Matrix4.identity();
    // Update perspective and render
    resizeCanvas();
}
function setupModelButtons() {
    const buttons = document.querySelectorAll('.model-button');
    console.log('Found buttons:', buttons.length);
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const modelPath = button.getAttribute('data-model');
            console.log('Button clicked, loading model:', modelPath);
            if (modelPath && modelPath !== currentModelPath) {
                currentModelPath = modelPath;
                // Update active button
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                // Load new model
                await loadAndDisplayModel(modelPath);
                console.log('Model loaded and displayed');
            }
        });
    });
}
async function loadModel(filename) {
    const text = await fetchText(filename);
    const lines = text.trim().split('\n');
    const boxes = [];
    for (const line of lines) {
        // Remove comments (anything after #)
        const cleanLine = line.split('#')[0].trim();
        if (!cleanLine)
            continue;
        const values = cleanLine.split(/\s+/).map(parseFloat);
        if (values.length === 9) {
            boxes.push({
                center: new Vector3(values[0], values[1], values[2]),
                width: values[3],
                height: values[4],
                depth: values[5],
                color: new Vector3(values[6], values[7], values[8]),
            });
        }
    }
    return boxes;
}
function calculateModelBounds(boxes) {
    if (boxes.length === 0) {
        modelCentroid = new Vector3(0, 0, 0);
        modelRadius = 1;
        console.log('No boxes found, using default bounds');
        return;
    }
    // Calculate centroid
    let sumX = 0, sumY = 0, sumZ = 0;
    for (const box of boxes) {
        sumX += box.center.x;
        sumY += box.center.y;
        sumZ += box.center.z;
    }
    modelCentroid = new Vector3(sumX / boxes.length, sumY / boxes.length, sumZ / boxes.length);
    // Calculate radius (max distance from centroid to any box corner)
    modelRadius = 0;
    for (const box of boxes) {
        const halfWidth = box.width / 2;
        const halfHeight = box.height / 2;
        const halfDepth = box.depth / 2;
        // Check all 8 corners of the box
        const corners = [
            new Vector3(box.center.x - halfWidth, box.center.y - halfHeight, box.center.z - halfDepth),
            new Vector3(box.center.x + halfWidth, box.center.y - halfHeight, box.center.z - halfDepth),
            new Vector3(box.center.x - halfWidth, box.center.y + halfHeight, box.center.z - halfDepth),
            new Vector3(box.center.x + halfWidth, box.center.y + halfHeight, box.center.z - halfDepth),
            new Vector3(box.center.x - halfWidth, box.center.y - halfHeight, box.center.z + halfDepth),
            new Vector3(box.center.x + halfWidth, box.center.y - halfHeight, box.center.z + halfDepth),
            new Vector3(box.center.x - halfWidth, box.center.y + halfHeight, box.center.z + halfDepth),
            new Vector3(box.center.x + halfWidth, box.center.y + halfHeight, box.center.z + halfDepth),
        ];
        for (const corner of corners) {
            const dist = corner.subtract(modelCentroid).magnitude;
            if (dist > modelRadius) {
                modelRadius = dist;
            }
        }
    }
    console.log('Model bounds calculated - Centroid:', modelCentroid, 'Radius:', modelRadius);
}
function createBoxelMesh(boxes) {
    const positions = [];
    const colors = [];
    const indices = [];
    let vertexOffset = 0;
    for (const box of boxes) {
        // Adjust position to center the model at origin
        const cx = box.center.x - modelCentroid.x;
        const cy = box.center.y - modelCentroid.y;
        const cz = box.center.z - modelCentroid.z;
        const hw = box.width / 2;
        const hh = box.height / 2;
        const hd = box.depth / 2;
        // 8 vertices of the box
        const vertices = [
            [cx - hw, cy - hh, cz - hd],
            [cx + hw, cy - hh, cz - hd],
            [cx + hw, cy + hh, cz - hd],
            [cx - hw, cy + hh, cz - hd],
            [cx - hw, cy - hh, cz + hd],
            [cx + hw, cy - hh, cz + hd],
            [cx + hw, cy + hh, cz + hd],
            [cx - hw, cy + hh, cz + hd],
        ];
        // Add vertices
        for (const vertex of vertices) {
            positions.push(...vertex);
            colors.push(box.color.x, box.color.y, box.color.z);
        }
        // 12 triangles (2 per face, 6 faces)
        const faceIndices = [
            // Front
            [0, 1, 2], [0, 2, 3],
            // Back
            [5, 4, 7], [5, 7, 6],
            // Top
            [3, 2, 6], [3, 6, 7],
            // Bottom
            [4, 5, 1], [4, 1, 0],
            // Right
            [1, 5, 6], [1, 6, 2],
            // Left
            [4, 0, 3], [4, 3, 7],
        ];
        for (const face of faceIndices) {
            indices.push(vertexOffset + face[0], vertexOffset + face[1], vertexOffset + face[2]);
        }
        vertexOffset += 8;
    }
    return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors),
        indices: new Uint32Array(indices),
    };
}
function handleKeyDown(event) {
    const rotationAngleDeg = 5;
    let newRotation;
    // Support both arrow keys and WASD for rotation
    switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            newRotation = Matrix4.rotateX(-rotationAngleDeg);
            rotationMatrix = newRotation.multiplyMatrix(rotationMatrix);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            newRotation = Matrix4.rotateX(rotationAngleDeg);
            rotationMatrix = newRotation.multiplyMatrix(rotationMatrix);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            newRotation = Matrix4.rotateY(rotationAngleDeg);
            rotationMatrix = newRotation.multiplyMatrix(rotationMatrix);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            newRotation = Matrix4.rotateY(-rotationAngleDeg);
            rotationMatrix = newRotation.multiplyMatrix(rotationMatrix);
            break;
        default:
            return;
    }
    render();
}
function handleWheel(event) {
    event.preventDefault();
    // Adjust zoom based on wheel
    const zoomSpeed = 0.1;
    if (event.deltaY < 0) {
        // Scroll up - zoom in
        zoomFactor = Math.max(0.5, zoomFactor - zoomSpeed);
    }
    else {
        // Scroll down - zoom out
        zoomFactor = Math.min(10, zoomFactor + zoomSpeed);
    }
    render();
}
function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.58, 0.0, 0.83, 1.0); // Dark violet
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    shaderProgram.bind();
    // Translate the model away from camera (move it back in Z) with zoom
    const translation = Matrix4.translate(0, 0, -modelRadius * zoomFactor);
    const worldFromModel = translation.multiplyMatrix(rotationMatrix);
    shaderProgram.setUniformMatrix4fv('clipFromWorld', clipFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);
    vao.bind();
    vao.drawIndexed(gl.TRIANGLES);
    vao.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    const fovY = 45;
    const near = 0.1;
    const far = modelRadius * 10;
    clipFromWorld = Matrix4.perspective(fovY, aspectRatio, near, far);
    render();
}
window.addEventListener('load', () => initialize());
