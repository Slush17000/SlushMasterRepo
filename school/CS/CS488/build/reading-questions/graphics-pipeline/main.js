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
    // Graphics pipeline questions:
    console.log(`1. Which phrase is a description of world space?`);
    console.log(`   The coordinate system describing the environment in which all models are arranged.\n`);
    console.log(`2. Which phrase is a description of normalized space?`);
    console.log(`   The coordinate system whose central unit cube the graphics card projects to the viewport.\n`);
    console.log(`3. What's the aspect ratio of a rectangle that is 640 units wide and 400 units tall?`);
    console.log(`   1.6\n`);
    console.log(`4. Which of the following are needed in the z-buffer algorithm?`);
    console.log(`   A per-fragment check of the depth and a buffer holding the depth values of each pixel\n`);
    console.log(`5. A vertex has eye space position [45, 60, -90]. The scene is rendered with a perspective projection that has a near distance of 24. What are the vertex's xy-coordinates when it's projected onto the image plane?`);
    console.log(`   x_plane = 12`);
    console.log(`   y_plane = 16\n`);
    console.log(`6. The viewer is stationed at [2, 1, 3] in world space. What is the viewer's location in eye space?`);
    console.log(`   x_eye = 0`);
    console.log(`   y_eye = 0`);
    console.log(`   z_eye = 0\n`);
    console.log(`7. A fragment has RGBA color [0.2, 0.6, 0.9, 0.4]. The RGB color [1, 1, 0] is currently stored in the framebuffer. If conventional blending is enabled, what color is written to the framebuffer?`);
    console.log(`   r = 0.68`);
    console.log(`   g = 0.84`);
    console.log(`   b = 0.36\n`);
    console.log(`8. You are trying to build render a scene without distortion. Suppose top = 300 for a viewing volume centered around the eye. For each aspect ratio, identity the corresponding value of right.`);
    console.log(`   aspect ratio = 1.0, right = 300`);
    console.log(`   aspect ratio = 1.2, right = 360`);
    console.log(`   aspect ratio = 0.6, right = 180\n`);
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
