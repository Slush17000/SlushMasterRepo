import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { VertexArray } from 'lib/vertex-array.js';
import { fetchText } from 'lib/web-utilities.js';
let canvas;
let shaderProgram;
let vao;
let fragmentTemplate;
let mouseX = 0;
let mouseY = 0;
let startTime = 0;
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    // Initialize other graphics state as needed.
    const positions = new Float32Array([
        // First triangle
        -1, -1, 0, // bottom left
        1, -1, 0, // bottom right
        -1, 1, 0, // top left
        // Second triangle
        -1, 1, 0, // top left
        1, -1, 0, // bottom right
        1, 1, 0 // top right
    ]);
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', 6, 3, positions);
    // Load, compile, and link shaders:
    const vertexSource = await fetchText('flat-vertex.glsl');
    fragmentTemplate = await fetchText('flat-fragment.glsl');
    const editor = document.getElementById('editor');
    // Initial compile
    shaderProgram = compileShaderWithUserCode(vertexSource, editor.value);
    vao = new VertexArray(shaderProgram, attributes);
    startTime = performance.now() * 0.001;
    requestAnimationFrame(loop);
    // Event listeners
    // Mouse
    canvas.addEventListener('mousemove', (event) => {
        // Mouse coordinates relative to the canvas
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
        render();
    });
    // Recompile on input
    editor.addEventListener('input', () => {
        const userCode = editor.value.trim();
        try {
            const newProgram = compileShaderWithUserCode(vertexSource, userCode);
            const newVao = new VertexArray(newProgram, attributes);
            shaderProgram = newProgram;
            vao = newVao;
            render();
        }
        catch (e) {
            if (e instanceof Error) {
                console.error("Shader compile error:", e.message);
            }
            else {
                console.error("Shader compile error:", e);
            }
            alert("Shader compile error");
        }
    });
    // Resize
    window.addEventListener('resize', () => resizeCanvas());
    resizeCanvas();
}
function loop() {
    render();
    requestAnimationFrame(loop);
}
function compileShaderWithUserCode(vertexSrc, userCode) {
    const fragmentSrc = fragmentTemplate.replace('// USER_CODE', userCode);
    return new ShaderProgram(vertexSrc, fragmentSrc);
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
