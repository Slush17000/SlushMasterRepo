import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
import { Vector3 } from 'lib/vector.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let vao: VertexArray;
let attributes: VertexAttributes;
let n = 6;
let radius = 0.9;

async function initialize() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    // Initialize other graphics state as needed.
    // Load, compile, and link shaders
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    generateCircle(n, radius);

    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());

    const nInput = document.getElementById('n-input') as HTMLInputElement;
    nInput.addEventListener('input', () => {
        n = parseInt(nInput.value);
        synchronize();
    });
    const radian_count = document.getElementById('radius-input') as HTMLInputElement;
    radian_count.addEventListener('input', () => {
        radius = parseFloat(radian_count.value);
        synchronize();
    });

    resizeCanvas();
}

function generateCircle(n: number, radius: number) {
    const jumpAngleDeg = 360 / n;
    const jumpAngleRad = jumpAngleDeg * (Math.PI / 180);
    let positions: Vector3[] = [];

    for (let i = 0; i < n; i++) {
        // Looks cool but isn't right:
        // positions.push(new Vector3(radius * Math.cos(i * jumpAngle + n), radius * Math.sin(i * jumpAngle + n), 0));
        positions.push(new Vector3(radius * Math.cos(i * jumpAngleRad), radius * Math.sin(i * jumpAngleRad), 0));

    }

    let flatPositions = new Float32Array(positions.flatMap(p => p.xyz));

    attributes = new VertexAttributes();
    attributes.addAttribute('position', positions.length, 3, flatPositions);

    // Load, compile, and link shaders
    vao = new VertexArray(shaderProgram, attributes);
}

function synchronize() {
    // Release previous VAO and VBOs.
    vao.destroy();
    attributes.destroy();

    // Regenerate circle and redraw.
    generateCircle(n, radius);
    render();
}

function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Cornflower:
    // gl.clearColor(0.392, 0.584, 0.929, 1);

    // Purple:
    // gl.clearColor(0.625, 0, 1, 1);

    // Spring Green:
    // gl.clearColor(0, 1, 0.5, 1);

    // Red
    gl.clearColor(1, 0, 0, 1);

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