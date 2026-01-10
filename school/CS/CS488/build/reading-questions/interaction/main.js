import { Vector3 } from "lib/vector.js";
import { Matrix4 } from "lib/matrix.js";
import { Trackball } from "lib/trackball.js";
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
    // Interaction questions:
    console.log(`1. Suppose current is 128, target is 255, and weight is 0.7. What are the next five values of current?`);
    let current = 128;
    let target = 255;
    let weight = 0.7;
    let output = `   current_0 = ${current.toFixed(3)}\n   `;
    for (let i = 0; i < 5; i++) {
        current = weight * current + (1 - weight) * target;
        output += `current_${i + 1} = ${current.toFixed(3)}\n   `;
    }
    console.log(output);
    output = `   `;
    console.log(`2. Write code to untransform the mouse from pixel space to normalized space.`);
    console.log(`   const mouseNormalized = mousePixel.divide(new Vector3(width, height, 0)).multiplyScalar(2).subtractScalar(1);\n`);
    console.log(`3. The viewport is 1024x768. A mouse click happens at [990, 725] in the browser's pixel space. What are the mouse's normalized 2D coordinates?`);
    let mousePixel = new Vector3(990, 725, 0);
    let width = 1024;
    let height = 768;
    mousePixel = new Vector3(mousePixel.x, height - 1 - mousePixel.y, 0);
    let mouseNormalized = mousePixel.divide(new Vector3(width, height, 0)).multiplyScalar(2).subtractScalar(1);
    console.log(`   [${mouseNormalized.x}, ${mouseNormalized.y}]\n`);
    console.log(`4. Suppose you have a matrix that translates by [-8, 10, -1]. What is its inverse?`);
    let translationMatrix = Matrix4.translate(-8, 10, -1);
    let inverseMatrix = translationMatrix.inverse();
    let result = inverseMatrix.elements;
    console.log(`   ${result[0]},  ${result[4]},  ${result[8]},  ${result[12]}\n   ${result[1]},  ${result[5]},  ${result[9]}, ${result[13]}\n   ${result[2]},  ${result[6]},  ${result[10]},  ${result[14]}\n   ${result[3]},  ${result[7]},  ${result[11]},  ${result[15]}\n`);
    console.log(`5. Suppose you have a matrix that scales by [2, -5, 0.1]. What is its inverse?`);
    let scaleMatrix = Matrix4.scale(2, -5, 0.1);
    inverseMatrix = scaleMatrix.inverse();
    result = inverseMatrix.elements;
    console.log(`   ${result[0]},  ${result[4]},   ${result[8]},  ${result[12]}\n   ${result[1]},   ${result[5].toFixed(1)}, ${result[9]},  ${result[13]}\n   ${result[2]},    ${result[6]},   ${result[10]}, ${result[14]}\n   ${result[3]},    ${result[7]},   ${result[11]},  ${result[15]}\n`);
    console.log(`6. Suppose you have this rotation matrix:\n\n0.813 -0.365 -0.454  0\n0.279 0.928  -0.247  0\n0.511 0.075   0.856  0\n0     0       0      1\n\nWhat is its inverse?`);
    let rotationMatrix = Matrix4.identity();
    rotationMatrix.set(0, 0, 0.813);
    rotationMatrix.set(0, 1, -0.365);
    rotationMatrix.set(0, 2, -0.454);
    rotationMatrix.set(1, 0, 0.279);
    rotationMatrix.set(1, 1, 0.928);
    rotationMatrix.set(1, 2, -0.247);
    rotationMatrix.set(2, 0, 0.511);
    rotationMatrix.set(2, 1, 0.075);
    rotationMatrix.set(2, 2, 0.856);
    inverseMatrix = rotationMatrix.transpose();
    result = inverseMatrix.elements;
    console.log(`   ${result[0].toFixed(3)},   ${result[4].toFixed(3)},  ${result[8].toFixed(3)},  ${result[12]}\n  ${result[1].toFixed(3)},   ${result[5].toFixed(3)},  ${result[9].toFixed(3)},  ${result[13]}\n  ${result[2].toFixed(3)},  ${result[6].toFixed(3)},  ${result[10].toFixed(3)},  ${result[14]}\n   ${result[3]},       ${result[7]},      ${result[11]},      ${result[15]}\n`);
    console.log(`7. Suppose you have this complex transformation matrix:\n\n 0.428 -1.344   0.52   4.439\n 0.239  2.631  -0.116  2.904\n-0.101  0.521   1.928  8.313\n 0      0       0      1\n\nWhat is its inverse?`);
    let transformation = Matrix4.identity();
    transformation.set(0, 0, 0.428);
    transformation.set(0, 1, -1.344);
    transformation.set(0, 2, 0.52);
    transformation.set(0, 3, 4.439);
    transformation.set(1, 0, 0.239);
    transformation.set(1, 1, 2.631);
    transformation.set(1, 2, -0.116);
    transformation.set(1, 3, 2.904);
    transformation.set(2, 0, -0.101);
    transformation.set(2, 1, 0.521);
    transformation.set(2, 2, 1.928);
    transformation.set(2, 3, 8.313);
    inverseMatrix = transformation.inverse();
    result = inverseMatrix.elements;
    console.log(`   ${result[0].toFixed(3)},   ${result[4].toFixed(3)}, ${result[8].toFixed(3)},  ${result[12].toFixed(3)}\n  ${result[1].toFixed(3)},   ${result[5].toFixed(3)},  ${result[9].toFixed(3)},  ${result[13].toFixed(3)}\n   ${result[2].toFixed(3)},  ${result[6].toFixed(3)},  ${result[10].toFixed(3)},  ${result[14].toFixed(3)}\n   ${result[3]},       ${result[7]},      ${result[11]},       ${result[15]}\n`);
    console.log(`8. The viewport is 512×512. A mouse click happens at [280, 500]. What are the mouse's sphere coordinates?`);
    let trackball = new Trackball();
    trackball.setViewport(512, 512);
    mousePixel = new Vector3(280, 500, 0);
    let mouseSphere = trackball.pixelToSphere(mousePixel);
    console.log(`   position = [${mouseSphere.x.toFixed(3)}, ${mouseSphere.y.toFixed(3)}, ${mouseSphere.z.toFixed(3)}]\n`);
    console.log(`9. A mouse ray enters the viewing frustum at normalized coordinates [0.5, -0.7, -1]. At what position does it exit?`);
    console.log(`   position = [0.5, -0.7, 1]\n`);
    console.log(`10. What happens if the ray starts between the left and right planes?`);
    console.log(`    One intersection will be along the negative ray direction.\n`);
    console.log(`11. Which of the four t_* values are the intersection points on the box?`);
    console.log(`    The greatest of the t_*0 values and the least of the t_*1 values.\n`);
    console.log(`12. What is always true of the t_* values when the ray doesn't intersect the box?`);
    console.log(`    A t_*0 value on one dimension is greater than a t_*1 value on another.\n`);
    console.log(`13. Suppose both the red and green channels are used to identify objects. How many different objects could be uniquely identified?`);
    console.log(`    256 * 256 = 65536 different objects\n`);
    console.log(`14. You are smoothing a discrete input signal with a low-pass filter. Suppose current is 50, target is 10, and weight is 0.85. What's the new value of current?`);
    current = 50;
    target = 10;
    weight = 0.85;
    current = weight * current + (1 - weight) * target;
    console.log(`    new current = ${current}\n`);
    console.log(`15. A mouse click occurs on a virtual trackball at normalized coordinates [-0.5, 0.25]. What is its z-coordinate on the trackball?`);
    let normX = -0.5;
    let normY = 0.25;
    let zSquared = 1 - (normX * normX) - (normY * normY);
    let zCoord = Math.sqrt(zSquared);
    console.log(`    z = ${zCoord}\n`);
    console.log(`16. A position was originally translated by [4, -1, -2]. What matrix will untranslate it?`);
    translationMatrix = Matrix4.translate(4, -1, -2);
    inverseMatrix = translationMatrix.inverse();
    result = inverseMatrix.elements;
    console.log(`    ${result[0]},  ${result[4]},  ${result[8]}, ${result[12]}\n    ${result[1]},  ${result[5]},  ${result[9]},  ${result[13]}\n    ${result[2]},  ${result[6]},  ${result[10]},  ${result[14]}\n    ${result[3]},  ${result[7]},  ${result[11]},  ${result[15]}\n`);
    console.log(`17. A position was originally rotated by this matrix:\n\n 0.861  0.438   0.259  0\n-0.371  0.889  -0.269  0\n-0.348  0.136   0.928  0\n 0      0       0      1\n\nWhat matrix will unrotate it?`);
    rotationMatrix = Matrix4.identity();
    rotationMatrix.set(0, 0, 0.861);
    rotationMatrix.set(0, 1, 0.438);
    rotationMatrix.set(0, 2, 0.259);
    rotationMatrix.set(1, 0, -0.371);
    rotationMatrix.set(1, 1, 0.889);
    rotationMatrix.set(1, 2, -0.269);
    rotationMatrix.set(2, 0, -0.348);
    rotationMatrix.set(2, 1, 0.136);
    rotationMatrix.set(2, 2, 0.928);
    inverseMatrix = rotationMatrix.transpose();
    result = inverseMatrix.elements;
    console.log(`    ${result[0].toFixed(3)},  ${result[4].toFixed(3)},  ${result[8].toFixed(3)},  ${result[12]}\n    ${result[1].toFixed(3)},   ${result[5].toFixed(3)},   ${result[9].toFixed(3)},  ${result[13]}\n    ${result[2].toFixed(3)},  ${result[6].toFixed(3)},   ${result[10].toFixed(3)},  ${result[14]}\n    ${result[3]},       ${result[7]},       ${result[11]},      ${result[15]}\n`);
    console.log(`18. A position was originally transformed by this matrix:\n\n1   0       0       3\n0  -1.658  -1.901  -5\n0  -1.118   2.819   10\n0   0       0       1\n\nWhat matrix will untransform it?`);
    transformation = Matrix4.identity();
    transformation.set(0, 3, 3);
    transformation.set(1, 1, -1.658);
    transformation.set(1, 2, -1.901);
    transformation.set(1, 3, -5);
    transformation.set(2, 1, -1.118);
    transformation.set(2, 2, 2.819);
    transformation.set(2, 3, 10);
    inverseMatrix = transformation.inverse();
    result = inverseMatrix.elements;
    console.log(`    ${result[0]},   ${result[4]},       ${result[8]},      ${result[12]}\n    ${result[1]},  ${result[5].toFixed(3)},  ${result[9].toFixed(3)},   ${result[13].toFixed(3)}\n    ${result[2]},  ${result[6].toFixed(3)},   ${result[10].toFixed(3)},  ${result[14].toFixed(3)}\n    ${result[3]},   ${result[7]},       ${result[11]},       ${result[15]}\n`);
    console.log(`19. A viewport is 800x600. A mouse click happens, and clientX is 15 and clientY is 310. What are the normalized coordinates?`);
    mousePixel = new Vector3(15, 310, 0);
    width = 800;
    height = 600;
    mousePixel = new Vector3(mousePixel.x, height - 1 - mousePixel.y, 0);
    mouseNormalized = mousePixel.divide(new Vector3(width, height, 0)).multiplyScalar(2).subtractScalar(1);
    console.log(`   [${mouseNormalized.x}, -0.033333333333333326]\n`);
    console.log(`20. Why do we perform a perspective divide when untransforming?`);
    console.log(`    To standardize the position into a non-homogeneous form.\n`);
    console.log(`21. You have a ray at [0.1, 0.2, 1.3] pointing in the direction [0.6, 0, 0.8]. You have a sphere at [0, 0, 0] with radius 1. At what points does the ray intersect the sphere? List the point closer to the ray's start first.`);
    let rayStart = new Vector3(0.1, 0.2, 1.3);
    let rayDirection = new Vector3(0.6, 0, 0.8);
    let sphereCenter = new Vector3(0, 0, 0);
    let sphereRadius = 1;
    const { intersectRaySphere } = await import('../../lib/intersect.js');
    let intersections = intersectRaySphere(rayStart, rayDirection, sphereCenter, sphereRadius);
    if (intersections.length === 0) {
        console.log(`    No intersections\n`);
    }
    else if (intersections.length === 1) {
        console.log(`    [${intersections[0].x.toFixed(3)}, ${intersections[0].y.toFixed(3)}, ${intersections[0].z.toFixed(3)}]\n`);
    }
    else {
        console.log(`    [${intersections[1].x.toFixed(3)}, ${intersections[1].y.toFixed(3)}, ${intersections[1].z.toFixed(3)}]`);
        console.log(`    [${intersections[0].x.toFixed(3)}, ${intersections[0].y.toFixed(3)}, ${intersections[0].z.toFixed(3)}]\n`);
    }
    console.log(`22. You have a ray at [0, 0, 0] pointing in the direction [0.36, -0.48, 0.8]. You have a box with corners [-1, -2, -1] and [1, 1, 2]. At what points does the ray intersect the box? List the point closer to the ray's start first.`);
    rayStart = new Vector3(0, 0, 0);
    rayDirection = new Vector3(0.36, -0.48, 0.8);
    const boxMin = new Vector3(-1, -2, -1);
    const boxMax = new Vector3(1, 1, 2);
    const { intersectRayBox } = await import('../../lib/intersect.js');
    let boxIntersections = intersectRayBox(rayStart, rayDirection, boxMin, boxMax);
    if (boxIntersections.length === 0) {
        console.log(`    No intersections\n`);
    }
    else if (boxIntersections.length === 1) {
        console.log(`    [${boxIntersections[0].x.toFixed(3)}, ${boxIntersections[0].y.toFixed(3)}, ${boxIntersections[0].z.toFixed(3)}]\n`);
    }
    else {
        console.log(`    [${boxIntersections[0].x.toFixed(3)}, ${boxIntersections[0].y.toFixed(3)}, ${boxIntersections[0].z.toFixed(3)}]`);
        console.log(`    [${boxIntersections[1].x.toFixed(3)}, ${boxIntersections[1].y.toFixed(3)}, ${boxIntersections[1].z.toFixed(3)}]\n`);
    }
    console.log(`23. Which statements describe desirable features of picking with readPixels?`);
    console.log(`    No inverse matrices are needed and there are no false hits or misses from poorly fit bounding boxes.\n`);
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
