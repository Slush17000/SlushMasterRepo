import { Vector3 } from "lib/vector.js";
import { Matrix4 } from "lib/matrix.js";

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

    // Camera and terrain questions:
    // Q1: Which matrix?
    console.log(`1. Which matrix does our camera abstraction generate?\n   eyeFromWorld\n`);

    // Q2: Up in eye space
    let m = Matrix4.identity();
    m.set(0, 0, 0.876);
    m.set(0, 1, -0.382);
    m.set(0, 2, 0.296);
    m.set(1, 0, 0.42);
    m.set(1, 1, 0.904);
    m.set(1, 2, -0.076);
    m.set(2, 0, -0.239);
    m.set(2, 1, 0.191);
    m.set(2, 2, 0.952);
    let e = transposeMatrix4(m.elements);
    let output = `2. You have this rotation matrix:\n`;
    for (let row = 0; row < 4; row++) {
        output +=
            `  ${e[row * 4 + 0].toFixed(3).padStart(6)} ` +
            `${e[row * 4 + 1].toFixed(3).padStart(6)} ` +
            `${e[row * 4 + 2].toFixed(3).padStart(6)} ` +
            `${e[row * 4 + 3].toFixed(3).padStart(6)}\n`;
    }

    output += `\n   What world space vectors will become [1, 0, 0], [0, 1, 0], and [0, 0, 1] in eye space?\n`;
    output += `   [1, 0, 0]: [0.876, -0.382, 0.296]\n`;
    output += `   [0, 1, 0]: [0.42, 0.904, -0.076]\n`;
    output += `   [0, 0, 1]: [-0.239, 0.191, 0.952]\n`;
    console.log(output);

    // Q3: Calculating forward vector 1
    let to = new Vector3(1, 1, -5);
    let from = new Vector3(-10, 3, 7);
    let forward = to.subtract(from).normalize();
    console.log(`3. A camera is situated at [-10, 3, 7] looking at [1, 1, -5]. What is its forward vector?`);
    console.log(`   forward = [${forward.x.toFixed(3)}, ${forward.y.toFixed(3)}, ${forward.z.toFixed(3)}]\n`);

    // Q4: Moving the camera 1
    from = new Vector3(5, 1, -3)
    forward = new Vector3(-0.7492, 0.0937, -0.6556);
    let right = new Vector3(0.6585, 0, -0.7526);
    let strafeDistance = 1.5;
    let advanceDistance = -3.2;
    from = from.add(right.multiplyScalar(strafeDistance));
    from = from.add(forward.multiplyScalar(advanceDistance));
    console.log(`4. A camera is situated at [5, 1, -3] with forward vector [-0.7492, 0.0937, -0.6556] and right vector [0.6585, 0, -0.7526]. It strafes 1.5 units and advances -3.2 units. What is its new position?`);
    console.log(`   position = [${from.x.toFixed(3)}, ${from.y.toFixed(3)}, ${from.z.toFixed(3)}]\n`);

    // Q5: Axes of rotation
    console.log(`5. For each kind of turning, identify the axis of the viewer about which the rotation occurs.`);
    console.log(`   Yaw: y-axis`);
    console.log(`   Pitch: x-axis`);
    console.log(`   Roll: z-axis\n`);

    // Q6: Rotate around an arbitrary axis 1
    let axis = new Vector3(-0.4082, 0.8165, 0.4082);
    let degrees = 45;
    m = Matrix4.rotateAround(axis, degrees);
    e = transposeMatrix4(m.elements);
    output = `6. You wish to rotate ${degrees} degrees around the axis [${axis.x}, ${axis.y}, ${axis.z}]. What is the rotation matrix?\n`;
    for (let row = 0; row < 4; row++) {
        output +=
            ` ${e[row * 4 + 0].toFixed(4).padStart(8)} ` +
            `${e[row * 4 + 1].toFixed(4).padStart(8)} ` +
            `${e[row * 4 + 2].toFixed(4).padStart(8)} ` +
            `${e[row * 4 + 3].toFixed(4).padStart(8)}\n`;
    }
    console.log(output);
    // console.table(m.elements);

    // Q7: Where to 1
    console.log(`7. A camera is situated at [0, 2, 1] looking along the negative z-axis. Each stroke of the WASD keys moves 1 unit. Each stroke of the QE keys turns 90 degrees. Suppose the user hits the keys: W, D, D, E, W, W, A. At what position does the camera arrive?`);
    console.log(`   position = [4, 2, -1]\n`);

    // Q8: Unclamped pitch
    console.log(`8. Suppose the pitch wasn't clamped in the renderer. What would the camera's right vector be if the user tilted the mouse so the camera pointed straight up?`);
    console.log(`   right = [0, 0, 0]\n`);

    // Q9: Calculating forward vector 2
    to = new Vector3(0, 0, 0);
    from = new Vector3(5, 2, -3);
    forward = to.subtract(from).normalize();
    console.log(`9. The camera is sitting at [5, 2, -3] and looking at [0, 0, 0]. What is the camera's normalized forward vector?`);
    console.log(`   forward = [${forward.x.toFixed(3)}, ${forward.y.toFixed(3)}, ${forward.z.toFixed(3)}]\n`);

    // Q10: Moving the camera 2
    from = new Vector3(2, -4, 1)
    forward = new Vector3(-1, 0, 0);
    right = new Vector3(0, 0, -1);
    advanceDistance = 2;
    from = from.add(forward.multiplyScalar(advanceDistance));
    console.log(`10. The camera is at [2, -4, 1], has forward vector [-1, 0, 0], and right vector [0, 0, -1]. The user advances 2 units. What is the camera's new position?`);
    console.log(`    position = [${from.x.toFixed(3)}, ${from.y.toFixed(3)}, ${from.z.toFixed(3)}]\n`);

    // Q11: Moving the camera 3
    from = new Vector3(2, -4, 1)
    forward = new Vector3(-1, 0, 0);
    right = new Vector3(0, 0, -1);
    strafeDistance = -2;
    from = from.add(right.multiplyScalar(strafeDistance));
    console.log(`11. The camera is at [2, -4, 1], has forward vector [-1, 0, 0], and right vector [0, 0, -1]. The user strafes -2 units. What is the camera's new position?`);
    console.log(`    position = [${from.x.toFixed(3)}, ${from.y.toFixed(3)}, ${from.z.toFixed(3)}]\n`);

    // Q12: Rotate around an arbitrary axis 2
    axis = new Vector3(0.6882, 0.2294, -0.6882);
    degrees = -30;
    m = Matrix4.rotateAround(axis, degrees);
    e = transposeMatrix4(m.elements);
    output = `12. You wish to rotate ${degrees} degrees around the axis [${axis.x}, ${axis.y}, ${axis.z}]. What is the rotation matrix?\n`;
    for (let row = 0; row < 4; row++) {
        output +=
            ` ${e[row * 4 + 0].toFixed(4).padStart(8)} ` +
            `${e[row * 4 + 1].toFixed(4).padStart(8)} ` +
            `${e[row * 4 + 2].toFixed(4).padStart(8)} ` +
            `${e[row * 4 + 3].toFixed(4).padStart(8)}\n`;
    }
    console.log(output);

    // Q13: Calculating right vector
    from = new Vector3(4, -2, 8);
    to = new Vector3(-2, -2, 8);
    forward = to.subtract(from).normalize();
    let up = new Vector3(0, 1, 0);
    right = forward.cross(up).normalize();
    console.log(`13. The camera is sitting at [4, -2, 8] and looking at [-2, -2, 8]. The sky is up. What is the camera's right vector?`);
    console.log(`    right = [${right.x.toFixed(3)}, ${right.y.toFixed(3)}, ${right.z.toFixed(3)}]\n`);

    // Q14: Where to 2
    console.log(`14. A camera is situated at [10, 7, -6] looking at something farther along the positive x-axis. The sky is up. Each stroke of the WASD keys moves 1 unit. Each stroke of the QE keys turns 90 degrees. Suppose the user hits these keys: S, S, A, Q, Q, D, D, W. At what position does the camera arrive?`);
    console.log(`   position = [7, 7, -9]\n`);

    // Q15: Calculate distance from starting position
    console.log(`15. A player strafes 2.5 units, advances -3.7, advances 0.4, strafes -9.2, and advances 5.8. How far away is the player from the starting location?`);
    console.log(`    distance = 7.151 units\n`);

    // Q16: Expected rotations
    console.log(`16. Which rotation behaviors would a tripod-mounted telescope support?`);
    console.log(`    Yaw & Pitch\n`);

    // Q17: Player movement
    console.log(`17. A player strafes 2.5 units, advances -3.7, advances 0.4, strafes -9.2, and advances 5.8. How far away is the player from the starting location?`);
    console.log(`    distance = 7.151 units\n`);

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