let canvas: HTMLCanvasElement;

const logDiv = document.getElementById('log')!;
const originalLog = console.log;

console.log = (...args: any[]) => {
    originalLog.apply(console, args);
    logDiv.textContent += args.join(' ') + "\n";
};

async function initialize() {
    canvas = document.getElementById('canvas') as HTMLCanvasElement;
    window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

    // Points and lines questions:
    console.log(`1. Which tasks must be completed in a vertex shader?`);
    console.log(`   Assign a value to gl_Position\n`);

    console.log(`2. Complete the call to gl.clearColor below so that the background is colored springgreen as defined in the HTML/CSS standards. Use literal numbers, not arithmetic expressions.`);
    console.log(`   gl.clearColor(0.0, 1.0, 0.5, 1.0);\n`);

    console.log(`3. Which is the most accurate definition of a vertex array object?`);
    console.log(`   A mapping that binds data in a vertex buffer object to the attributes received in a vertex shader\n`);

    console.log(`4. A model has 3182 vertices, each with a 3D position, an RGB color, and a scalar property between 0 and 1 measuring the vertex's ambient occlusion factor. How many floats are in the model's vertex buffers?`);
    console.log(`   22,274 floats\n`);

    console.log(`5. What's the non-homogeneous value of [6, 14, 5, 2.5]?`);
    console.log(`   [2.4, 5.6, 2]\n`);

    console.log(`6. What is the significance of in variables declared at the top-level in a vertex shader?`);
    console.log(`   They are per-vertex data read from a vertex buffer.\n`);

    console.log(`7. What is the inverse of vector [15, -23, -2]?`);
    console.log(`   inverse = [-15, 23, 2]\n`);

    console.log(`8. What is the magnitude of vector [6, 7, -3]?`);
    console.log(`   magnitude = 9.695359714\n`);

    console.log(`9. You have the following code in your initialize function:\n\nconst positions = [\n  -1, -1, 0,\n   1, -1, 0,\n   1,  1, 0,\n  -1,  1, 0,\n];\nattributes = new VertexAttributes();\nattributes.addAttribute('positions', 4, 3, positions);\n\nshaderProgram = new ShaderProgram(vertexSource, fragmentSource);\nvao = new VertexArray(shaderProgram, attributes);\n\nBased on the examples shown in your readings, write the single statement that will draw these vertices as two line segments.`);
    console.log(`   vao.drawSequence(gl.LINES);\n`);

    console.log(`10. What is the magnitude of the vector that is the sum of the vectors [0, 3, -1] and [-3, 2, 0]? Round to the nearest 1000th.`);
    console.log(`    magnitude = 5.916\n`);

    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());

    resizeCanvas();
}

function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
}

function transposeMatrix4(elements: ArrayLike<number>): number[] {
    const t = new Array(16);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            t[c * 4 + r] = elements[r * 4 + c];
        }
    }
    return t;
}

window.addEventListener('load', () => initialize());