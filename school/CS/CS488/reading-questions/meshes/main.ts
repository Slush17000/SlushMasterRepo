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

    // Mesh questions:
    console.log(`1. A grid has 5 lines of latitude and 7 lines of longitude. Given the row-major mesh layout described in the reading, what is the index of the vertex at latitude 4 and longitude 3?`);
    console.log(`   31\n`);

    console.log(`2. You've lerped between 10 and 50 and gotten back 38. What was t?`);
    console.log(`   0.7\n`);

    console.log(`3. A sphere has a seed position of [6, -2, 0]. What is its position when rotated 12 degrees?`);
    console.log(`   rotatedPosition = [5.868885604, -2, 1.247470144]\n`);

    console.log(`4. An uncapped cone mesh has 18 lines of latitude and 5 lines of longitude. How many vertices and faces does it have?`);
    console.log(`   vertex count = 90`);
    console.log(`   face count = 170\n`);

    console.log(`5. Vectors v and w are 45 degrees apart. How many vectors are perpendicular to both?`);
    console.log(`   2\n`);

    console.log(`6. [1, 0, 0] x [0, 0, 1] = [0, -1, 0]\n`);

    console.log(`7. v x v = [0, 0, 0]\n`);

    console.log(`8. What vector leads from position B to position A? A = [5, -2, 7], B = [8, 10, 3]`);
    console.log(`   vector = A - B = [-3, -12, 4]\n`);

    console.log(`9. What is the normal of the triangle with the following vertex positions? The vertices are enumerated in counter-clockwise order around the triangle's front face. Be careful on the normal's direction. A = [0.1, -0.2, 0.3], B = [0.1, 0.2, 0.3], C = [-0.25, 0, 0.1]`);
    console.log(`   normal = [-0.4961389383568339, 0, 0.8682431421244592]\n`);

    console.log(`10. What is the normal of a vertex that is shared by four faces with the following normals? A = [0.3, 0.7, 0.65], B = [0.1, 0.91, 0.4], C = [0.33, 0.8, -0.5], D = [-0.25, 0.92, -0.3]`);
    console.log(`    normal = [0.14227734829693967, 0.9870491038100191, 0.07410278557132277]\n`);

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