import { Vector3 } from 'lib/vector.js';
import { Trimesh } from 'lib/trimesh.js';
import { lerp } from 'lib/math-utilities.js';
export class Prefab {
    static grid(width, height, longitudeCount, latitudeCount) {
        const positions = [];
        for (let lat = 0; lat < latitudeCount; ++lat) {
            const y = lat / (latitudeCount - 1) * height;
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const x = lon / (longitudeCount - 1) * width;
                positions.push(new Vector3(x, y, 0));
            }
        }
        const index = (lon, lat) => {
            return lat * longitudeCount + lon;
        };
        const faces = [];
        for (let lat = 0; lat < latitudeCount - 1; ++lat) {
            for (let lon = 0; lon < longitudeCount - 1; ++lon) {
                const nextLon = lon + 1;
                const nextLat = lat + 1;
                faces.push([
                    index(lon, lat),
                    index(nextLon, lat),
                    index(lon, nextLat)
                ]);
                faces.push([
                    index(nextLon, lat),
                    index(nextLon, nextLat),
                    index(lon, nextLat)
                ]);
            }
        }
        return new Trimesh(positions, faces);
    }
    static cylinder(radius, height, longitudeCount, latitudeCount) {
        const positions = [];
        for (let lat = 0; lat < latitudeCount; ++lat) {
            const y = lat / (latitudeCount - 1) * height;
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const radians = lon / longitudeCount * 2 * Math.PI;
                const x = radius * Math.cos(radians);
                const z = radius * Math.sin(radians);
                positions.push(new Vector3(x, y, z));
            }
        }
        const index = (lon, lat) => {
            return lat * longitudeCount + lon;
        };
        const faces = [];
        for (let lat = 0; lat < latitudeCount - 1; ++lat) {
            for (let lon = 0; lon < longitudeCount; ++lon) {
                let nextLon = (lon + 1) % longitudeCount;
                let nextLat = lat + 1;
                faces.push([
                    index(lon, lat),
                    index(nextLon, lat),
                    index(lon, nextLat),
                ]);
                faces.push([
                    index(nextLon, lat),
                    index(nextLon, nextLat),
                    index(lon, nextLat),
                ]);
            }
        }
        return new Trimesh(positions, faces);
    }
    static oscillatingCylinder(radius, height, longitudeCount, latitudeCount, amplitude = 0.1, waves = 4) {
        const positions = [];
        for (let lat = 0; lat < latitudeCount; ++lat) {
            const t = lat / (latitudeCount - 1);
            const y = t * height;
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const lonT = lon / longitudeCount;
                const radians = lonT * 2 * Math.PI;
                // radius modulation combines a vertical wave and a circumferential wave
                const radialMod = Math.sin(waves * 2 * Math.PI * t + lonT * 2 * Math.PI);
                const r = radius + amplitude * radialMod;
                const x = r * Math.cos(radians);
                const z = r * Math.sin(radians);
                positions.push(new Vector3(x, y, z));
            }
        }
        const index = (lon, lat) => {
            return lat * longitudeCount + lon;
        };
        const faces = [];
        for (let lat = 0; lat < latitudeCount - 1; ++lat) {
            for (let lon = 0; lon < longitudeCount; ++lon) {
                let nextLon = (lon + 1) % longitudeCount;
                let nextLat = lat + 1;
                faces.push([
                    index(lon, lat),
                    index(lon, nextLat),
                    index(nextLon, lat),
                ]);
                faces.push([
                    index(nextLon, lat),
                    index(lon, nextLat),
                    index(nextLon, nextLat),
                ]);
            }
        }
        return new Trimesh(positions, faces);
    }
    static cone(topRadius, bottomRadius, length, longitudeCount, latitudeCount) {
        const positions = [];
        for (let lat = 0; lat < latitudeCount; ++lat) {
            const radius = lerp(bottomRadius, topRadius, lat / (latitudeCount - 1));
            const y = lat / (latitudeCount - 1) * length;
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const radians = lon / longitudeCount * 2 * Math.PI;
                const x = radius * Math.cos(radians);
                const z = radius * Math.sin(radians);
                positions.push(new Vector3(x, y, z));
            }
        }
        const index = (lon, lat) => {
            return lat * longitudeCount + lon;
        };
        const faces = [];
        for (let lat = 0; lat < latitudeCount - 1; ++lat) {
            for (let lon = 0; lon < longitudeCount; ++lon) {
                let nextLon = (lon + 1) % longitudeCount;
                let nextLat = lat + 1;
                faces.push([
                    index(lon, lat),
                    index(lon, nextLat),
                    index(nextLon, lat),
                ]);
                faces.push([
                    index(nextLon, lat),
                    index(lon, nextLat),
                    index(nextLon, nextLat),
                ]);
            }
        }
        return new Trimesh(positions, faces);
    }
    static sphere(radius, longitudeCount, latitudeCount) {
        const positions = [];
        // Generate vertices
        for (let lat = 0; lat < latitudeCount; ++lat) {
            const latRadians = lerp(-Math.PI * 0.5, Math.PI * 0.5, lat / (latitudeCount - 1));
            const x = radius * Math.cos(latRadians); // horizontal radius at this latitude
            const y = radius * Math.sin(latRadians); // vertical position
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const lonRadians = lon / longitudeCount * 2 * Math.PI;
                positions.push(new Vector3(x * Math.cos(lonRadians), y, x * Math.sin(lonRadians)));
            }
        }
        const index = (lon, lat) => {
            return lat * longitudeCount + lon;
        };
        const faces = [];
        // Generate faces (quads split into two triangles)
        for (let lat = 0; lat < latitudeCount - 1; ++lat) {
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const nextLon = (lon + 1) % longitudeCount;
                const nextLat = lat + 1;
                // bottom-left triangle
                faces.push([
                    index(lon, lat),
                    index(nextLon, lat),
                    index(lon, nextLat),
                ]);
                // top-right triangle
                faces.push([
                    index(nextLon, lat),
                    index(nextLon, nextLat),
                    index(lon, nextLat),
                ]);
            }
        }
        return new Trimesh(positions, faces);
    }
    static torus(innerRadius, outerRadius, longitudeCount, latitudeCount) {
        const positions = [];
        // Generate vertices
        for (let lat = 0; lat < latitudeCount; ++lat) {
            const v = (lat / latitudeCount) * 2 * Math.PI; // tube angle
            const cosV = Math.cos(v);
            const sinV = Math.sin(v);
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const u = (lon / longitudeCount) * 2 * Math.PI; // around torus
                const cosU = Math.cos(u);
                const sinU = Math.sin(u);
                const x = (outerRadius + innerRadius * cosV) * cosU;
                const y = (outerRadius + innerRadius * cosV) * sinU;
                const z = innerRadius * sinV;
                positions.push(new Vector3(x, y, z));
            }
        }
        const index = (lon, lat) => {
            return lat * longitudeCount + lon;
        };
        const faces = [];
        // Generate faces (both directions wrap)
        for (let lat = 0; lat < latitudeCount; ++lat) {
            const nextLat = (lat + 1) % latitudeCount;
            for (let lon = 0; lon < longitudeCount; ++lon) {
                const nextLon = (lon + 1) % longitudeCount;
                // bottom-left triangle
                faces.push([
                    index(lon, lat),
                    index(nextLon, lat),
                    index(lon, nextLat),
                ]);
                // top-right triangle
                faces.push([
                    index(nextLon, lat),
                    index(nextLon, nextLat),
                    index(lon, nextLat),
                ]);
            }
        }
        return new Trimesh(positions, faces);
    }
    static skybox() {
        const positions = [
            new Vector3(-1, -1, 1),
            new Vector3(1, -1, 1),
            new Vector3(-1, 1, 1),
            new Vector3(1, 1, 1),
            new Vector3(-1, -1, -1),
            new Vector3(1, -1, -1),
            new Vector3(-1, 1, -1),
            new Vector3(1, 1, -1),
        ];
        const faces = [
            [1, 0, 2],
            [1, 2, 3],
            [4, 5, 7],
            [4, 7, 6],
            [5, 1, 3],
            [5, 3, 7],
            [0, 4, 6],
            [0, 6, 2],
            [6, 7, 3],
            [6, 3, 2],
            [0, 1, 5],
            [0, 5, 4],
        ];
        return new Trimesh(positions, faces);
    }
}
