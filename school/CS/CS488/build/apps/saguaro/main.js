import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Gltf } from 'lib/static-gltf.js';
import { Matrix4 } from 'lib/matrix.js';
let canvas;
let shaderProgram;
let vaoGltf;
let clipFromWorld;
let currentDegrees = 90;
let transformation = Matrix4.identity();
// Pointer drag state for interactive rotation
let dragging = false;
let dragStartX = 0;
let dragStartAngle = 0; // in degrees
// dragSensitivity in degrees per pixel
const dragSensitivity = 0.3;
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    // Load a glTF model
    const model = await Gltf.readFromUrl('../../models/saguaro.gltf');
    const mesh = model.meshes[0];
    const attrsGltf = new VertexAttributes();
    attrsGltf.addAttribute('position', mesh.positions.count, 3, mesh.positions.buffer);
    attrsGltf.addAttribute('position', model.meshes[0].positions.count, 3, model.meshes[0].positions.buffer);
    attrsGltf.addAttribute('normal', model.meshes[0].colors.count, 3, model.meshes[0].colors.buffer);
    attrsGltf.addIndices(new Uint32Array(model.meshes[0].indices.buffer));
    vaoGltf = new VertexArray(shaderProgram, attrsGltf);
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    // Pointer events for interactive rotation
    canvas.addEventListener('pointerdown', (ev) => onPointerDown(ev));
    canvas.addEventListener('pointermove', (ev) => onPointerMove(ev));
    canvas.addEventListener('pointerup', (ev) => onPointerUp(ev));
    canvas.addEventListener('pointercancel', (ev) => onPointerUp(ev));
    // Keyboard controls: WASD for rotation around Y axis (A/D or left/right rotate)
    window.addEventListener('keydown', (ev) => {
        const stepDegrees = 5; // degrees per key press
        if (ev.key === 'a' || ev.key === 'A') {
            currentDegrees -= stepDegrees;
            render();
        }
        else if (ev.key === 'd' || ev.key === 'D') {
            currentDegrees += stepDegrees;
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
    dragStartAngle = currentDegrees;
    // pause any transient interactions while dragging
    try {
        canvas.setPointerCapture(ev.pointerId);
    }
    catch (e) { /* ignore */ }
}
function onPointerMove(ev) {
    if (!dragging)
        return;
    const dx = ev.clientX - dragStartX;
    currentDegrees = dragStartAngle + (-dx) * dragSensitivity;
    currentDegrees = ((currentDegrees % 360) + 360) % 360;
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
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    shaderProgram.bind();
    shaderProgram.setUniformMatrix4fv('clipFromWorld', clipFromWorld);
    transformation = Matrix4.rotateY(currentDegrees);
    const mainScale = Matrix4.scale(0.6, 0.6, 0.6);
    const mainTransform = transformation.multiplyMatrix(mainScale);
    shaderProgram.setUniformMatrix4fv("transform", mainTransform.elements);
    vaoGltf.bind();
    vaoGltf.drawIndexed(gl.TRIANGLES);
    const childOffsets = [
        { x: -0.3, y: 6.7, z: 2.0 },
        { x: 0.3, y: 6.7, z: -2.0 },
        { x: 0, y: 9.13, z: 0 },
    ];
    const childScale = Matrix4.scale(0.2, 0.2, 0.2);
    for (const off of childOffsets) {
        const t = transformation
            .multiplyMatrix(Matrix4.translate(off.x, off.y, off.z))
            .multiplyMatrix(childScale);
        shaderProgram.setUniformMatrix4fv("transform", t.elements);
        vaoGltf.drawIndexed(gl.TRIANGLES);
    }
    vaoGltf.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    const size = 7;
    const center = [0, 6];
    const near = -1000;
    const far = 1000;
    if (aspectRatio >= 1) {
        clipFromWorld = ortho(center[0] - size * aspectRatio, center[0] + size * aspectRatio, center[1] - size, center[1] + size, near, far);
    }
    else {
        clipFromWorld = ortho(center[0] - size, center[0] + size, center[1] - size / aspectRatio, center[1] + size / aspectRatio, near, far);
    }
    render();
}
function ortho(left, right, bottom, top, near = -1000, far = 1000) {
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
