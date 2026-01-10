import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let vao: VertexArray;
let mouseX = 0;
let mouseY = 0;
let startTime = 0;

async function initialize() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    // Initialize other graphics state as needed.
    const positions = new Float32Array([
        // First triangle
        -1, -1, 0,   // bottom left
        1, -1, 0,   // bottom right
        -1, 1, 0,   // top left

        // Second triangle
        -1, 1, 0,   // top left
        1, -1, 0,   // bottom right
        1, 1, 0    // top right
    ]);

    const attributes = new VertexAttributes();
    attributes.addAttribute('position', 6, 3, positions);

    // Load, compile, and link shaders:
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    vao = new VertexArray(shaderProgram, attributes);

    startTime = performance.now() * 0.001;
    requestAnimationFrame(loop);

    // Event listeners
    // Mouse
    canvas.addEventListener('mousemove', (event: MouseEvent) => {
        // Mouse coordinates relative to the canvas
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
        render();
    });

    // Resize
    window.addEventListener('resize', () => resizeCanvas());
    resizeCanvas();
}

function loop() {
    render();
    requestAnimationFrame(loop);
}

function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Black background
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    shaderProgram.bind();

    // Set dimensions, mouse, and time uniforms
    shaderProgram.setUniform2f('dimensions', canvas.width, canvas.height);
    shaderProgram.setUniform2f('mouse', mouseX, mouseY);
    const time = performance.now() * 0.001 - startTime;
    shaderProgram.setUniform1f('time', time);

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