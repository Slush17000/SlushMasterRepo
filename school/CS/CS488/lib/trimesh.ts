import { Vector3 } from 'lib/vector.js';

export class Trimesh {
    positions: Vector3[];
    faces: number[][];
    min!: Vector3;
    max!: Vector3;
    normals: Vector3[] | null;

    constructor(positions: Vector3[], faces: number[][]) {
        this.positions = positions;
        this.faces = faces;
        this.computeMinMax();
        this.normals = null;
    }

    get vertexCount() {
        return this.positions.length;
    }

    get faceCount() {
        return this.faces.length;
    }

    computeMinMax() {
        // Guess the min and max to be the first position.
        this.min = this.positions[0].clone();
        this.max = this.positions[0].clone();

        // Try ousting the min and max.
        for (let position of this.positions) {
            if (position.x < this.min.x) {
                this.min.x = position.x;
            } else if (position.x > this.max.x) {
                this.max.x = position.x;
            }

            if (position.y < this.min.y) {
                this.min.y = position.y;
            } else if (position.y > this.max.y) {
                this.max.y = position.y;
            }

            if (position.z < this.min.z) {
                this.min.z = position.z;
            } else if (position.z > this.max.z) {
                this.max.z = position.z;
            }
        }
    }

    get faceBuffer() {
        return new Uint32Array(this.faces.flat());
    }

    get positionBuffer() {
        const xyzs = this.positions.flatMap(p => p.xyz);
        return new Float32Array(xyzs);
    }

    get normalBuffer() {
        const xyzs = this.normals!.flatMap(p => p.xyz);
        return new Float32Array(xyzs);
    }

    computeNormals() {
        const normals = this.positions.map(_ => new Vector3(0, 0, 0));

        for (let face of this.faces) {
            const positionA = this.positions[face[0]];
            const positionB = this.positions[face[1]];
            const positionC = this.positions[face[2]];
            const vectorAB = positionB.subtract(positionA);
            const vectorAC = positionC.subtract(positionA);
            const faceNormal = vectorAB.cross(vectorAC);

            // Only add the normal if it's not degenerate (zero magnitude)
            if (faceNormal.magnitude > 0.0001) {
                const normalizedFaceNormal = faceNormal.normalize();
                normals[face[0]] = normals[face[0]].add(normalizedFaceNormal);
                normals[face[1]] = normals[face[1]].add(normalizedFaceNormal);
                normals[face[2]] = normals[face[2]].add(normalizedFaceNormal);
            }
        }

        this.normals = normals.map(normal => {
            // Handle vertices with no valid faces
            if (normal.magnitude > 0.0001) {
                return normal.normalize();
            } else {
                // Default to pointing up if no valid normal
                return new Vector3(0, 1, 0);
            }
        });
    }
}
