import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Gltf } from 'lib/static-gltf.js';
let canvas;
let shaderProgram;
let vaoGltf;
let clipFromWorld;
let currentRadians = 0;
let isRotating = true;
let loopRunning = false;
let rafId = null;
let lastTimestamp = null;
// rotationSpeed in radians per second (full rotation in ~6 seconds)
const rotationSpeed = Math.PI * 2 / 6;
// Pointer drag state for interactive rotation
let dragging = false;
let dragStartX = 0;
let dragStartAngle = 0;
let wasRotatingBeforeDrag = false;
const dragSensitivity = 0.01; // radians per pixel
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    // Load a glTF model
    const model = await Gltf.readFromUrl('../../models/engine.gltf');
    const mesh = model.meshes[0];
    const attrsGltf = new VertexAttributes();
    attrsGltf.addAttribute('position', mesh.positions.count, 3, mesh.positions.buffer);
    attrsGltf.addAttribute('position', model.meshes[0].positions.count, 3, model.meshes[0].positions.buffer);
    attrsGltf.addAttribute('normal', model.meshes[0].normals.count, 3, model.meshes[0].normals.buffer);
    attrsGltf.addIndices(new Uint32Array(model.meshes[0].indices.buffer));
    vaoGltf = new VertexArray(shaderProgram, attrsGltf);
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    // Pointer events for interactive rotation
    canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
    canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
    canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
    canvas.addEventListener('pointercancel', (ev) => onPointerUp(ev));
    resizeCanvas();
    // start the RAF-based animation
    startAnimation();
    // Hook up toggle button
    const toggle = document.getElementById('toggle-rotate');
    if (toggle) {
        toggle.addEventListener('click', () => {
            isRotating = !isRotating;
            toggle.textContent = isRotating ? 'Stop Rotate' : 'Start Rotate';
            if (isRotating)
                startAnimation();
            else
                stopAnimation();
        });
        toggle.textContent = 'Stop Rotate';
    }
}
function onPointerDown(ev) {
    if (!canvas)
        return;
    dragging = true;
    dragStartX = ev.clientX;
    dragStartAngle = currentRadians;
    wasRotatingBeforeDrag = isRotating;
    // pause auto-rotate while dragging
    isRotating = false;
    stopAnimation();
    try {
        canvas.setPointerCapture(ev.pointerId);
    }
    catch (e) { /* ignore */ }
}
function onPointerMove(ev) {
    if (!dragging)
        return;
    const dx = ev.clientX - dragStartX;
    currentRadians = dragStartAngle + dx * dragSensitivity;
    // normalize
    currentRadians = ((currentRadians % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    render();
}
function onPointerUp(ev) {
    if (!dragging)
        return;
    dragging = false;
    try {
        canvas.releasePointerCapture(ev.pointerId);
    }
    catch (e) { /* ignore */ }
    // resume auto-rotate if it was running before drag
    isRotating = wasRotatingBeforeDrag;
    if (isRotating)
        startAnimation();
}
function startAnimation() {
    if (loopRunning)
        return;
    loopRunning = true;
    lastTimestamp = null;
    rafId = requestAnimationFrame(animate);
}
function stopAnimation() {
    loopRunning = false;
    if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
    lastTimestamp = null;
}
function animate(timestamp) {
    if (!isRotating) {
        loopRunning = false;
        rafId = null;
        lastTimestamp = null;
        return;
    }
    if (lastTimestamp === null)
        lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000; // seconds
    lastTimestamp = timestamp;
    currentRadians += rotationSpeed * dt;
    if (currentRadians >= Math.PI * 2)
        currentRadians -= Math.PI * 2;
    render();
    rafId = requestAnimationFrame(animate);
}
function render() {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    shaderProgram.bind();
    shaderProgram.setUniformMatrix4fv('clipFromWorld', clipFromWorld);
    // set dynamic uniforms after binding program
    shaderProgram.setUniform1f('radians', currentRadians);
    // Draw glTF model
    shaderProgram.setUniform3f('factors', 2, 2, 0.1);
    shaderProgram.setUniform3f('offsets', 0.0, 0.0, 0.0);
    vaoGltf.bind();
    vaoGltf.drawIndexed(gl.TRIANGLES);
    vaoGltf.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    const size = 7;
    const center = [0, 0];
    if (aspectRatio >= 1) {
        clipFromWorld = ortho(center[0] - size * aspectRatio, center[0] + size * aspectRatio, center[1] - size, center[1] + size, -1, 1);
    }
    else {
        clipFromWorld = ortho(center[0] - size, center[0] + size, center[1] - size / aspectRatio, center[1] + size / aspectRatio, -1, 1);
    }
    render();
}
function ortho(left, right, bottom, top, near = -1, far = 1) {
    return new Float32Array([
        2 / (right - left), 0, 0, 0,
        0, 2 / (top - bottom), 0, 0,
        0, 0, 2 / (near - far), 0,
        -(right + left) / (right - left),
        -(top + bottom) / (top - bottom),
        (near + far) / (near - far),
        1,
    ]);
}
window.addEventListener('load', () => initialize());
