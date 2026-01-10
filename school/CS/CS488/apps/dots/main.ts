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
    // First Parallelogram
    const a = new Vector3(0.0, 0.5, 0);
    const b = new Vector3(0.5, 0.0, 0);
    const c = new Vector3(0.0, -0.5, 0);
    const d = a.add(c.subtract(b));
    const e = new Vector3(0.0, 0.5, 0);

    // Second Parallelogram
    const f = new Vector3(0.25, 0.25, 0);
    const g = new Vector3(0.25, -0.25, 0);
    const h = new Vector3(-0.25, -0.25, 0);
    const i = f.add(h.subtract(g));
    const j = new Vector3(0.25, 0.25, 0);

    let positions = [a, b, c, d, e, f, g, h, i, j];
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