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

    // Transformation machinery questions:
    console.log(`1. What is [1, 2, 3, 4] ⋅ [2, -1, 3, -1]?`);
    console.log(`   5\n`);

    console.log(`2. What is [a, b] ⋅ [-b, a]?`);
    console.log(`   0\n`);

    console.log(`3. To what value is a position's homogeneous coordinate set?`);
    console.log(`   1\n`);

    console.log(`4. What do you get when you dot a vector with itself?`);
    console.log(`   Its squared magnitude\n`);

    console.log(`5. You see this matrix multiplication C = A x B. How is c_23 computed?`);
    console.log(`   By dotting row 2 of A with column 3 of B\n`);

    console.log(`6. Suppose you have a rectangle whose lower-left vertex is at [-0.3, -0.4, -0.1] and whose upper-right vertex is at [0.3, 0.2, -0.1]. You want it to span from [0.1, -0.9, 0.2] to [0.7, -0.3, 0.2]. What parameters do you pass to the translate method to generate the desired transformation?`);
    console.log(`   let transform = Matrix4.translate(0.4, -0.5, 0.3);\n`);

    console.log(`7. Suppose you have this TypeScript code to build a chain of transformations:\n\nlet scale = Matrix4.scale(2, 2, 2);\nlet translate = Matrix4.translate(3, 0, 0);\nlet combo = translate.multiplyMatrix(scale);\n\nYou decide to flip the order of the matrices—but not change the effect of combo or the scale factors. What must the translation offsets be?\n`);
    console.log(`   let translate = Matrix4.translate(1.5, 0, 0);\n   let scale = Matrix4.scale(2, 2, 2);\n   let combo = scale.multiplyMatrix(translate);\n`);

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