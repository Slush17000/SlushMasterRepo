import { Vector3 } from "lib/vector.js";

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

    // Noise questions:
    console.log(`1. How many octaves are possible for each of the following one-dimensional resolutions?`);
    console.log(`   128: 8 octaves`);
    console.log(`   1024: 11 octaves`);
    console.log(`   2: 2 octaves`);
    console.log(`   32: 6 octaves\n`);

    console.log(`2. Suppose you are blending a pyramid of eight white noise textures. What weights are assigned to each level? Write the weights as fractions.`);
    console.log(`   Level 0: 1/255`);
    console.log(`   Level 1: 2/255`);
    console.log(`   Level 2: 4/255`);
    console.log(`   Level 3: 8/255`);
    console.log(`   Level 4: 16/255`);
    console.log(`   Level 5: 32/255`);
    console.log(`   Level 6: 64/255`);
    console.log(`   Level 7: 128/255\n`);

    console.log(`3. For each computational need, describe the lever that will trigger it.`);
    console.log(`   Consume less VRAM: Decrease the resolution`);
    console.log(`   Have a rougher appearance: Decrease the octave count`);
    console.log(`   Allow more levels: Increase the resolution`);
    console.log(`   Provide more fine detail: Increase the octave count\n`);

    console.log(`4. What are the floors, ceilings, and fractions of the following positions?`);
    console.log(`   [5.6, -3.3]:`);
    console.log(`      Floor = [5, -4]`);
    console.log(`      Ceiling = [6, -3]`);
    console.log(`      Fraction = [0.6, 0.7]`);
    console.log(`   [-0.8, 9]:`);
    console.log(`      Floor = [-1, 9]`);
    console.log(`      Ceiling = [0, 10]`);
    console.log(`      Fraction = [0.2, 0]\n`);

    console.log(`5. What are the values of the following TypeScript expressions?`);
    console.log(`   32 % 13 = 6`);
    console.log(`   3 % 25 = 3`);
    console.log(`   -5 % 32 = -5`);
    console.log(`   -35 % 32 = -3\n`);

    function wrap(x: number, period: number): number {
        return ((x % period) + period) % period;
    }

    console.log(`6. What are the values of the following TypeScript expressions?`);
    console.log(`   wrap(2, 4) = ${wrap(2, 4)}`);
    console.log(`   wrap(1, 4) = ${wrap(1, 4)}`);
    console.log(`   wrap(0, 4) = ${wrap(0, 4)}`);
    console.log(`   wrap(-1, 4) = ${wrap(-1, 4)}`);
    console.log(`   wrap(-2, 4) = ${wrap(-2, 4)}`);
    console.log(`   wrap(-3, 4) = ${wrap(-3, 4)}`);
    console.log(`   wrap(-4, 4) = ${wrap(-4, 4)}`);
    console.log(`   wrap(-5, 4) = ${wrap(-5, 4)}\n`);

    console.log(`7. What weight denominators are used for the following octave counts?`);
    console.log(`   10: 2^10 - 1 = 1023`);
    console.log(`   8: 2^8 - 1 = 255`);
    console.log(`   12: 2^12 - 1 = 4095\n`);

    console.log(`8. Suppose we have an algorithm like Field.toTrimesh and we apply noise to a 300x400 sloped terrain with a scale of 20 and this equation for calculating the height:\n\nheight = scale * noiseValue + x * 0.5 + 13\n\nWhat are the minimum and maximum possible heights?`);
    console.log(`   Minimum: 13`);
    console.log(`   Maximum: 182.5\n`);

    function randomGradient3(longitude: number, latitude: number): Vector3 {
        return new Vector3(
            Math.cos(latitude) * Math.cos(longitude),
            Math.sin(latitude),
            Math.cos(latitude) * Math.sin(longitude)
        )
    }

    console.log(`9. What are the gradients for the following longitude-latitude pairs? Include at least three digits are the decimal point.`);
    const grad1 = randomGradient3(2.8, -0.1);
    console.log(`   Longitude: 2.8, Latitude: -0.1 -> [${grad1.x.toFixed(3)}, ${grad1.y.toFixed(3)}, ${grad1.z.toFixed(3)}]`);
    const grad2 = randomGradient3(0.5, 1.4);
    console.log(`   Longitude: 0.5, Latitude: 1.4 -> [${grad2.x.toFixed(3)}, ${grad2.y.toFixed(3)}, ${grad2.z.toFixed(3)}]\n`);

    console.log(`10. Suppose we are generating a single 4D noise value. How many linear interpolations would we perform?`);
    console.log(`    1D -> 1`);
    console.log(`    2D -> 2 + 1 = 3`);
    console.log(`    3D -> 4 + 2 + 1 = 7`);
    console.log(`    4D -> 8 + 4 + 2 + 1 = 15\n`);

    console.log(`11. Which operation would change the size of the strata but not their frequency?`);
    console.log(`    Raising strataness (Ex. float strataness = sin(mixTexPosition.y) * 0.5 + 0.5;) to a power\n`);

    console.log(`12. Marble is produced by perturbing a pattern of stripes. Wood is produced by perturbing a pattern of concentric circles. What effect does this perturbation have?\n\nfloat d = mixTexPosition.x - 0.5;\nvec3 rgb = vec3(step(0.0, 1.0, d + noise));`);
    console.log(`    This perturbation produces a wobbly border\n`);

    console.log(`13. The value 0.01 is just an arbitrarily chosen offset that appears to work. What value would yield more accurate tangent vectors?`);
    console.log(`    The normalized size of a texel\n`);

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