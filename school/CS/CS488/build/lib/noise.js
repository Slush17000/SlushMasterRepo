import { Vector3 } from './vector.js';
import { lerp } from './math-utilities.js';
import { Field2 } from './field.js';
/**
 * Generate a projection of 3D noise onto a field.
 *
 * @param width The field's width
 * @param height The field's height
 * @param radius The size of the sphere from which to draw noise values
 * @param octaveCount The number of octaves of noise to layer
 */
export function noiseGlobe(width, height, radius, octaveCount) {
    let noise = new FractalNoise3(SlowNoise3.random(new Vector3(128, 128, 128)), octaveCount);
    // Project sphere of noise onto a 2D grid. Treat each point on the grid as a
    // latitute/longitude pair and convert it to a 3D Cartesian position.
    const noises = new Array(width * height);
    for (let r = 0; r < height; ++r) {
        const latRadians = lerp(-Math.PI * 0.5, Math.PI * 0.5, r / (height - 1));
        const x = radius * Math.cos(latRadians);
        const y = radius * Math.sin(latRadians);
        for (let c = 0; c < width; ++c) {
            const i = r * width + c;
            const lonRadians = c / width * -2 * Math.PI;
            const p = new Vector3(x * Math.cos(lonRadians), y, x * Math.sin(lonRadians));
            noises[i] = noise.get(p);
        }
    }
    // Find minimum and maximum noise values.
    let min = noises[0];
    let max = noises[0];
    for (let i = 0; i < noises.length; ++i) {
        if (noises[i] < min) {
            min = noises[i];
        }
        else if (noises[i] > max) {
            max = noises[i];
        }
    }
    // Normalize the noise values.
    const span = max - min;
    for (let i = 0; i < noises.length; ++i) {
        noises[i] = (noises[i] - min) / span;
    }
    const field = new Field2(width, height, noises);
    return field;
}
function smooth(t) {
    return 6 * t * t * t * t * t - 15 * t * t * t * t + 10 * t * t * t;
}
function randomUnitVector3() {
    const phi = Math.random() * 2 * Math.PI;
    const cosine = Math.random() - 0.5;
    const theta = Math.acos(cosine);
    return new Vector3(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta));
}
class Noise3 {
    static randomGradients(dimensions) {
        const gradients = new Array(dimensions.x * dimensions.y * dimensions.z);
        let i = 0;
        for (let z = 0; z < dimensions.z; ++z) {
            for (let y = 0; y < dimensions.y; ++y) {
                for (let x = 0; x < dimensions.x; ++x) {
                    gradients[i] = randomUnitVector3();
                    i += 1;
                }
            }
        }
        return gradients;
    }
}
function wrap(x, period) {
    return (x % period + period) % period;
}
class SlowNoise3 extends Noise3 {
    constructor(dimensions, gradients) {
        super();
        this.dimensions = dimensions;
        this.gradients = gradients;
    }
    get(p) {
        const base = new Vector3(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
        const apex = base.addScalar(1);
        const baseMod = new Vector3(wrap(base.x, this.dimensions.x), wrap(base.y, this.dimensions.y), wrap(base.z, this.dimensions.z));
        const apexMod = new Vector3(wrap(apex.x, this.dimensions.x), wrap(apex.y, this.dimensions.y), wrap(apex.z, this.dimensions.z));
        const fraction = p.subtract(base);
        const gradient000 = this.gradients[baseMod.x + this.dimensions.x * (baseMod.y + this.dimensions.y + baseMod.z)];
        const gradient100 = this.gradients[apexMod.x + this.dimensions.x * (baseMod.y + this.dimensions.y + baseMod.z)];
        const gradient010 = this.gradients[baseMod.x + this.dimensions.x * (apexMod.y + this.dimensions.y + baseMod.z)];
        const gradient110 = this.gradients[apexMod.x + this.dimensions.x * (apexMod.y + this.dimensions.y + baseMod.z)];
        const gradient001 = this.gradients[baseMod.x + this.dimensions.x * (baseMod.y + this.dimensions.y + apexMod.z)];
        const gradient101 = this.gradients[apexMod.x + this.dimensions.x * (baseMod.y + this.dimensions.y + apexMod.z)];
        const gradient011 = this.gradients[baseMod.x + this.dimensions.x * (apexMod.y + this.dimensions.y + apexMod.z)];
        const gradient111 = this.gradients[apexMod.x + this.dimensions.x * (apexMod.y + this.dimensions.y + apexMod.z)];
        const dot000 = p.subtract(new Vector3(base.x, base.y, base.z)).dot(gradient000);
        const dot100 = p.subtract(new Vector3(apex.x, base.y, base.z)).dot(gradient100);
        const dot010 = p.subtract(new Vector3(base.x, apex.y, base.z)).dot(gradient010);
        const dot110 = p.subtract(new Vector3(apex.x, apex.y, base.z)).dot(gradient110);
        const dot001 = p.subtract(new Vector3(base.x, base.y, apex.z)).dot(gradient001);
        const dot101 = p.subtract(new Vector3(apex.x, base.y, apex.z)).dot(gradient101);
        const dot011 = p.subtract(new Vector3(base.x, apex.y, apex.z)).dot(gradient011);
        const dot111 = p.subtract(new Vector3(apex.x, apex.y, apex.z)).dot(gradient111);
        const value00 = lerp(dot000, dot100, smooth(fraction.x));
        const value10 = lerp(dot010, dot110, smooth(fraction.x));
        const value01 = lerp(dot001, dot101, smooth(fraction.x));
        const value11 = lerp(dot011, dot111, smooth(fraction.x));
        const value0 = lerp(value00, value10, smooth(fraction.y));
        const value1 = lerp(value01, value11, smooth(fraction.y));
        const value = lerp(value0, value1, smooth(fraction.z));
        return value;
    }
    static random(dimensions) {
        const gradients = Noise3.randomGradients(dimensions);
        return new SlowNoise3(dimensions, gradients);
    }
}
class FractalNoise3 extends Noise3 {
    constructor(noise, octaveCount) {
        super();
        this.noise = noise;
        this.octaveCount = octaveCount;
    }
    get(p) {
        let sum = 0;
        for (let i = 0; i < this.octaveCount; i += 1) {
            const weight = (1 << i) / ((1 << this.octaveCount) - 1);
            sum += this.noise.get(p.multiplyScalar(1 / (1 << i))) * weight;
        }
        return sum;
    }
}
