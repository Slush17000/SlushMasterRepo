import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
import { Vector3 } from 'lib/vector.js';
let canvas;
let shaderProgram;
let vao;
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    // Initialize other graphics state as needed.
    const n = 20;
    let positions = [];
    for (let i = 0; i < n; ++i) {
        let radians = i / n * 2 * Math.PI;
        let x = Math.cos(radians);
        let y = Math.sin(radians);
        positions.push(new Vector3(x, y, 0));
        x = 0.7 * Math.cos(radians);
        y = 0.7 * Math.sin(radians);
        positions.push(new Vector3(x, y, 0));
    }
    let flatPositions = new Float32Array(positions.flatMap(p => p.xyz));
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', positions.length, 3, flatPositions);
    // Load, compile, and link shaders
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    vao = new VertexArray(shaderProgram, attributes);
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    resizeCanvas();
}
function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Cornflower:
    // gl.clearColor(0.392, 0.584, 0.929, 1);
    // Purple:
    // gl.clearColor(0.625, 0, 1, 1);
    // Spring Green:
    gl.clearColor(0, 1, 0.5, 1);
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
