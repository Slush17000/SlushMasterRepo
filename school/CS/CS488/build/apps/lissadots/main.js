import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
import { Vector3 } from 'lib/vector.js';
let canvas;
let shaderProgram;
let vao;
let n = 600;
let a = 0.5;
let b = 0.5;
let ratio = 10.0;
let shift = Math.PI;
let attributes = new VertexAttributes();
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    // Initialize other graphics state as needed.
    // Load, compile, and link shaders
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    generateLissajous();
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    const n_element = document.getElementById('n-input');
    const a_element = document.getElementById('a-input');
    const b_element = document.getElementById('b-input');
    const ratio_element = document.getElementById('ratio-input');
    const shift_element = document.getElementById('shift-input');
    n_element.addEventListener('input', () => { n = parseInt(n_element.value); synchronize(); });
    a_element.addEventListener('input', () => { a = parseFloat(a_element.value); synchronize(); });
    b_element.addEventListener('input', () => { b = parseFloat(b_element.value); synchronize(); });
    ratio_element.addEventListener('input', () => { ratio = parseFloat(ratio_element.value); synchronize(); });
    shift_element.addEventListener('input', () => { shift = parseFloat(shift_element.value); synchronize(); });
    resizeCanvas();
}
function synchronize() {
    // Release previous VAO and VBOs.
    vao.destroy();
    attributes.destroy();
    attributes = new VertexAttributes();
    // Regenerate Lissajous
    generateLissajous();
    render();
}
function generateLissajous() {
    let positions = [];
    for (let i = 0; i < n; i++) {
        const t = (i / n) * 2 * Math.PI;
        const x = a * Math.sin(t);
        const y = b * Math.sin(ratio * t + shift);
        const z = 0;
        positions.push(new Vector3(x, y, z));
    }
    let flatPositions = new Float32Array(positions.flatMap(p => p.xyz));
    attributes.addAttribute('position', positions.length, 3, flatPositions);
    // Load, compile, and link shaders
    vao = new VertexArray(shaderProgram, attributes);
}
function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Cornflower:
    // gl.clearColor(0.392, 0.584, 0.929, 1);
    // Purple:
    gl.clearColor(0.625, 0, 1, 1);
    // Spring Green:
    // gl.clearColor(0, 1, 0.5, 1);
    // Red
    // gl.clearColor(1, 0, 0, 1);
    // Turquoise:
    //gl.clearColor(0.251, 0.878, 0.816, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    shaderProgram.bind();
    vao.bind();
    vao.drawSequence(gl.LINE_LOOP);
    vao.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}
window.addEventListener('load', () => initialize());
