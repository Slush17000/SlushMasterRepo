let canvas;
const logDiv = document.getElementById('log');
const originalLog = console.log;
console.log = (...args) => {
    originalLog.apply(console, args);
    logDiv.textContent += args.join(' ') + "\n";
};
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    // Triangle and Transformation questions:
    console.log(`1. Translate position [-1, 4, 1] by offset [-5, 0, 10].`);
    console.log(`   translatedPosition = [-6, 4, 11]\n`);
    console.log(`2. Scale position [-2, 3, 2.5] by factors [-4, 3, 4].`);
    console.log(`   scaledPosition = [8, 9, 10]\n`);
    console.log(`3. Rotate position [-1, 3, -1] around the origin 120 degrees.`);
    console.log(`   rotatedPosition = [-2.09807621, -2.36602540, -1]\n`);
    console.log(`4. What is the minimal number of triangles needed to model a decagon?`);
    console.log(`   8\n`);
    console.log(`5. You have the following vertex buffer:\n\nconst positions = [\n  new Vector3(0.5, 0.0, 0.0),\n  new Vector3(0.0, -1.0, 0.0),\n  new Vector3(1.0, -1.0, 0.0),\n  new Vector3(1.0, 1.0, 0.0),\n  new Vector3(0.0, 1.0, 0.0),\n];\n\nFor each of these sequence types, identify how many primitives (points, lines, or triangles) will be assembled.`);
    console.log(`   gl.POINTS = 5`);
    console.log(`   gl.LINES = 2`);
    console.log(`   gl.TRIANGLES = 1`);
    console.log(`   gl.TRIANGLE_FAN = 3\n`);
    console.log(`6. What statement best describes the significance of uniform variables in a shader?`);
    console.log(`   They are variables that hold the same value across all primitives rendered by a draw call.\n`);
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
function transposeMatrix4(elements) {
    const t = new Array(16);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            t[c * 4 + r] = elements[r * 4 + c];
        }
    }
    return t;
}
window.addEventListener('load', () => initialize());
export {};
