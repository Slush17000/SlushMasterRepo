import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
let canvas;
let shaderProgram;
let vao;
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    // Initialize other graphics state as needed.
    const positions = new Float32Array([
        0.0, 0.0, 0, // Vertex 0
        1.0, 0.0, 0, // Vertex 1
        0.1, 0.1, 0, // Vertex 2
        0.0, 1.0, 0, // Vertex 3
        -0.1, 0.1, 0, // Vertex 4
        -1.0, 0.0, 0, // Vertex 5
        -0.1, -0.1, 0, // Vertex 6
        0.0, -1.0, 0, // Vertex 7
        0.1, -0.1, 0, // Vertex 8
        1.0, 0.0, 0, // Vertex 9
    ]);
    const colors = new Float32Array([
        1, 0, 0, // vertex 0 is red
        0, 0, 1, // vertex 1 is blue
        0, 1, 0, // vertex 2 is green
        1, 0, 0, // vertex 3 is red
        0, 0, 1, // vertex 4 is blue
        0, 1, 0, // vertex 5 is green
        1, 0, 0, // vertex 6 is red
        0, 0, 1, // vertex 7 is blue
        0, 1, 0, // vertex 8 is green
        1, 0, 0, // vertex 9 is red
    ]);
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', 10, 3, positions);
    attributes.addAttribute('color', 10, 3, colors);
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
    gl.clearColor(0.625, 0, 1, 1);
    // Spring Green:
    // gl.clearColor(0, 1, 0.5, 1);
    // Turqouoise:
    //gl.clearColor(0.251, 0.878, 0.816, 1);
    // Red
    // gl.clearColor(1, 0, 0, 1);
    // Turquoise:
    //gl.clearColor(0.251, 0.878, 0.816, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    shaderProgram.bind();
    vao.bind();
    vao.drawSequence(gl.TRIANGLE_FAN);
    vao.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}
window.addEventListener('load', () => initialize());
