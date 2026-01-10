import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
import { Vector3 } from 'lib/vector.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let vao: VertexArray;

async function initialize() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    // Initialize other graphics state as needed.
    const positions = new Float32Array([
        new Vector3(0.0, 0.0, 0),     // vertex 0 is at the origin
        new Vector3(0.5, 0.5, 0),     // vertex 1 is northeast
        new Vector3(0.5, -0.5, 0),    // vertex 2 is southeast
        new Vector3(0.0, 0.0, 0),   // vertex 3 is the origin again
        new Vector3(-0.5, -0.5, 0),   // vertex 4 is southwest
        new Vector3(-0.5, 0.5, 0),    // vertex 5 is northwest
    ].flatMap(position => position.xyz));

    const colors = new Float32Array([
        1, 0, 0,         // vertex 0 is red
        0, 0, 1,         // vertex 1 is blue
        0, 1, 0,         // vertex 2 is green
        1, 1, 0,         // vertex 3 is yellow
        1, 0, 1,         // vertex 4 is magenta
        0, 1, 1,         // vertex 5 is cyan
    ]);

    const attributes = new VertexAttributes();
    attributes.addAttribute('position', 6, 3, positions);
    attributes.addAttribute('color', 6, 3, colors);

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