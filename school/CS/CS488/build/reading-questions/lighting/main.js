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
    // Lighting questions:
    console.log(`1. If v and w are both normalized vectors, and a is the measure of the angle between them, which of the following are universally true?`);
    console.log(`   w · v = cos(a)`);
    console.log(`   v · w = cos(a)\n`);
    console.log(`2. Which values do we need to compute the specular term if we are using the Phong illumination model with Blinn's tweak?`);
    console.log(`   The normal vector, the shininess of the surface, and the vector halfway between the eye vector and light vector\n`);
    console.log(`3. A fragment's position is [5, 8, -11] and its normal is [0, 0, 1]. The light source is situated at [8, 10, -5]. All positions and vectors are in the same space. What is the fragment's litness?`);
    console.log(`   litness = 0.8571428571428571\n`);
    console.log(`4. A white surface is illuminated by both a magenta light and a blue light. What color is the surface where the two lights overlap?`);
    console.log(`   Magenta\n`);
    console.log(`5. A fragment's eye space position is [0.5, -3, -9] and its eye space normal is [0.57735, 0.57735, 0.57735]. The light source is situated at [0, 6, 0] in eye space. If the shininess is 2, what is the fragment's specularity when using Blinn-Phong illumination?`);
    console.log(`   specularity = 0.5875671462122736\n`);
    console.log(`6. What normal is halfway between [0.096, 0.36, -0.928] and [-0.152, 0.48, 0.864]?`);
    console.log(`   [-0.06632762293625646, 0.994914344043847, -0.07580299764143603]\n`);
    console.log(`7. What are the values of the following calls to step? Assume a doesn't equal b.`);
    console.log(`   step(-1, -2) = 0`);
    console.log(`   step(E, PI) = 1`);
    console.log(`   step(max(a, b), min(a, b)) = 0\n`);
    console.log(`8. You have the following statement in a fragment shader:\n\nlet spottedness = smoothstep(0.3, 0.5, focusedness);\n\nThe value of focusedness is 0.4. What can you say about the value of spottedness?`);
    console.log(`   It's between 0 and 1\n`);
    console.log(`9. Why do we perform lighting in eye space?`);
    console.log(`   To simplify the calculation of the specular term\n`);
    console.log(`10. A surface has an albedo of [0.3, 0.5, 0.1]. It's illuminated by a light with the color [0.8, 0.7, 1]. If the ambient factor is 0.2, what is the surface's ambient term?`);
    console.log(`   r = 0.048`);
    console.log(`   g = 0.07`);
    console.log(`   b = 0.02\n`);
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
