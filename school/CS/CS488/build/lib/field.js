import { Vector3 } from "./vector.js";
import { Trimesh } from "./trimesh.js";
import { lerp } from "./math-utilities.js";
export class Field2 {
    constructor(width, height, values) {
        this.width = width;
        this.height = height;
        this.values = values;
    }
    get2(x, y) {
        return this.values[y * this.width + x];
    }
    static readFromImage(image) {
        // Go through canvas to get the pixel data.
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0, image.width, image.height);
        const pixels = context.getImageData(0, 0, image.width, image.height);
        // The canvas is RGBA. Extract only the red channel.
        const grays = new Array(image.width * image.height);
        for (let i = 0; i < image.width * image.height; ++i) {
            grays[i] = pixels.data[i * 4] / 255;
        }
        return new Field2(image.width, image.height, grays);
    }
    toTrimesh(factors) {
        const positions = [];
        for (let z = 0; z < this.height; ++z) {
            for (let x = 0; x < this.width; ++x) {
                const y = this.get2(x, z);
                positions.push(new Vector3(x, y, z).multiply(factors));
            }
        }
        const index = (x, y) => {
            return y * this.width + x;
        };
        const faces = [];
        for (let y = 0; y < this.height - 1; ++y) {
            for (let x = 0; x < this.width - 1; ++x) {
                const nextX = x + 1;
                const nextY = y + 1;
                faces.push([index(x, y), index(x, nextY), index(nextX, y)]);
                faces.push([index(nextX, y), index(x, nextY), index(nextX, nextY)]);
            }
        }
        const mesh = new Trimesh(positions, faces);
        // Generate texture coordinates (normalized to 0-1 range)
        const texCoords = [];
        for (let z = 0; z < this.height; ++z) {
            for (let x = 0; x < this.width; ++x) {
                texCoords.push(x / (this.width - 1));
                texCoords.push(z / (this.height - 1));
            }
        }
        // Add texture coordinates to the mesh
        mesh.texCoords = new Float32Array(texCoords);
        return mesh;
    }
    blerp(x, y) {
        const floorX = Math.floor(x);
        const floorY = Math.floor(y);
        const fractionX = x - floorX;
        const fractionY = y - floorY;
        const bottomLeft = this.get2(floorX, floorY);
        const bottomRight = this.get2(floorX + 1, floorY);
        const topLeft = this.get2(floorX, floorY + 1);
        const topRight = this.get2(floorX + 1, floorY + 1);
        const bottom = lerp(bottomLeft, bottomRight, fractionX);
        const top = lerp(topLeft, topRight, fractionX);
        const middle = lerp(bottom, top, fractionY);
        return middle;
    }
}
