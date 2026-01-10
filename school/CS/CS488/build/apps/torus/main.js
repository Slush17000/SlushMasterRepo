import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Prefab } from 'lib/prefab.js';
let canvas;
let shaderProgram;
let vao;
let clipFromWorld;
let rotationRadiansX = 0;
let rotationRadiansY = 0;
let dragging = false;
let dragStartX = 0;
let dragStartAngle = 0;
let dragStartY = 0;
let dragStartAngleY = 0;
const dragSensitivity = .01; // radians per pixel
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const innerRadius = 0.25;
    const outerRadius = .5;
    const longitudeCount = 100;
    const latitudeCount = 100;
    const trimesh = Prefab.torus(innerRadius, outerRadius, longitudeCount, latitudeCount);
    const attributes = new VertexAttributes();
    trimesh.computeNormals();
    const torusNormals = trimesh.normalBuffer;
    attributes.addAttribute('position', trimesh.vertexCount, 3, trimesh.positionBuffer);
    attributes.addIndices(trimesh.faceBuffer);
    attributes.addAttribute('normal', trimesh.vertexCount, 3, torusNormals);
    // Load, compile, and link shaders
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    vao = new VertexArray(shaderProgram, attributes);
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
    canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
    canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
    canvas.addEventListener('pointercancel', (ev) => onPointerUp(ev));
    window.addEventListener('keydown', event => {
        const step = 0.02 * Math.PI; // Smoother rotation step
        if (event.key === 'ArrowLeft') {
            rotationRadiansX += step;
            render();
        }
        else if (event.key === 'ArrowRight') {
            rotationRadiansX -= step;
            render();
        }
        else if (event.key === 'ArrowUp') {
            rotationRadiansY += step;
            render();
        }
        else if (event.key === 'ArrowDown') {
            rotationRadiansY -= step;
            render();
        }
    });
    resizeCanvas();
}
function onPointerDown(ev) {
    if (!canvas)
        return;
    dragging = true;
    dragStartX = ev.clientX;
    dragStartAngle = rotationRadiansX;
    dragStartY = ev.clientY;
    dragStartAngleY = rotationRadiansY;
    try {
        canvas.setPointerCapture(ev.pointerId);
    }
    catch (e) { /* ignore */ }
}
function onPointerMove(ev) {
    if (!dragging)
        return;
    const dx = ev.clientX - dragStartX;
    rotationRadiansX = dragStartAngle + (-dx) * dragSensitivity;
    const dy = ev.clientY - dragStartY;
    rotationRadiansY = dragStartAngleY + (-dy) * dragSensitivity;
    // normalize
    rotationRadiansX = ((rotationRadiansX % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    rotationRadiansY = ((rotationRadiansY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
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
}
function render() {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    shaderProgram.bind();
    shaderProgram.setUniformMatrix4fv('clipFromWorld', clipFromWorld);
    shaderProgram.setUniform1f('radians2', rotationRadiansX);
    shaderProgram.setUniform1f('radians1', rotationRadiansY);
    shaderProgram.setUniform3f('factors', 1.0, 1.0, 0.001);
    shaderProgram.setUniform3f('colorParam', 1, 0, 1);
    vao.bind();
    vao.drawIndexed(gl.TRIANGLES);
    vao.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    const size = 1;
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
