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
    // Isosceles triangle vertices
    const a = new Vector3(0.3, 0.2, 0);
    const b = new Vector3(-0.5, -0.1, 0);
    const m = a.add(b).multiplyScalar(0.5);
    const diff = b.subtract(a);
    const ortho = new Vector3(diff.y, -diff.x, 0);
    const c = m.add(ortho);

    // Equilateral triangle vertices
    // const a = new Vector3(0.2, -0.9, 0);
    // const b = new Vector3(-0.5, -0.1, 0);
    // const m = a.add(b).scalarMultiply(0.5);
    // let diff = b.subtract(a);
    // const side = diff.magnitude;
    // diff = diff.normalize();
    // const ortho = new Vector3(diff.y, -diff.x, 0).scalarMultiply(side * Math.sqrt(3) / 2);
    // const c = m.add(ortho);

    let positions = [a, b, c];
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
    vao.drawSequence(gl.TRIANGLES);
    vao.unbind();
    shaderProgram.unbind();
}

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}

window.addEventListener('load', () => initialize());