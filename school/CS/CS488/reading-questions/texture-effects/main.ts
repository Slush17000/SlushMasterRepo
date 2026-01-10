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

    // Texture effects questions:
    console.log(`1. In what contexts may we call discard? Find the answer in the GLSL specification and by experimenting in a renderer.`);
    console.log(`   In a conditional statement in the fragment shader, outside of a conditional statement in the fragment shader, and in a helper function in the fragment shader.\n`);

    console.log(`2. Suppose a plant model has 2400 vertices. We want to render 300 plants. Suppose each vertex can be processed in 2 nanoseconds. How many nanoseconds will it take to render the plants if the plant is stored as a full model versus as a billboard?`);
    console.log(`   Full model: 2400 vertices * 300 plants * 2 ns = 1,440,000 ns`);
    console.log(`   Billboard: 4 vertices * 300 plants * 2 ns = 2,400 ns\n`);

    console.log(`3. Find a screenshot of a toon shaded model from a published game. Share its URL.`);
    console.log(`   https://philipiono.gumroad.com/l/LethalEmployee\n`);

    console.log(`4. Suppose we added an alpha channel to the table. We give all texels an alpha of 1, except for the leftmost texel, which we give an alpha of 0. Then we enable blending. What effect would this have on the toon-shaded model?`);
    console.log(`   It would be like back-face culling with respect to the light source.\n`);

    console.log(`5. Match each set of skybox texture coordinates to the face from which the color is drawn.`);
    console.log(`   [0.267, -1, 0.534] -> -y`);
    console.log(`   [0.586, 0.545, 1] -> +z`);
    console.log(`   [-0.986, 1, -0.999] -> +y\n`);

    console.log(`6. What happens if we disable the depth mask for the skybox but forget to reenable it before drawing more models?`);
    console.log(`   Whatever's drawn last will replace whatever's drawn earlier.\n`);

    console.log(`7. We already have the fragment position and normal in eye space in order to calculate the lighting terms. Why then do we do environment mapping in world space?`);
    console.log(`   If we computed it in eye space, the environment would turn as the eye turned and The skybox is most naturally considered a feature of the world.\n`);

    console.log(`8. Suppose we are computing ambient occlusion terms. What are the approximate occlusion terms for these vertices?`);
    console.log(`   A vertex at the center of a cylinder's cap: 1.0`);
    console.log(`   A vertex near a concavity where two planes meet perpendicularly: 0.5`);
    console.log(`   A vertex near a concavity where three planes meet perpendicularly: 0.25\n`);

    console.log(`9. What are the values of these calls to reduce?`);
    console.log(`   [2, 4, 9].reduce((accum, x) => accum * x) = 72`);
    console.log(`   [17, -5, 10, 3].reduce((accum, x) => accum + x) = 25`);
    console.log(`   ["8", "2", "33"].reduce((accum, x) => accum + x) = 8233\n`);

    console.log(`10. Suppose two or more signals are projected into a scene and overlap. How should these multiple colors be handled?`);
    console.log(`    They should be added together.\n`);

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