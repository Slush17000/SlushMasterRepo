import { Vector3 } from "./vector.js";
export function intersectRaySphere(rayStart, rayDirection, sphereCenter, sphereRadius) {
    const centerToStart = rayStart.subtract(sphereCenter);
    const a = rayDirection.dot(rayDirection);
    const b = 2 * centerToStart.dot(rayDirection);
    const c = centerToStart.dot(centerToStart) - sphereRadius * sphereRadius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) {
        return [];
    }
    else {
        const offset = Math.sqrt(discriminant);
        const t0 = (-b - offset) / (2 * a);
        const t1 = (-b + offset) / (2 * a);
        if (discriminant > 0) {
            return [
                rayStart.add(rayDirection.multiplyScalar(t0)),
                rayStart.add(rayDirection.multiplyScalar(t1))
            ];
        }
        else {
            return [
                rayStart.add(rayDirection.multiplyScalar(t0)),
            ];
        }
    }
}
export function intersectRayBox(rayStart, rayDirection, boxMin, boxMax) {
    // Intersect the ray with the left and right planes.
    let t0 = (boxMin.x - rayStart.x) / rayDirection.x;
    let t1 = (boxMax.x - rayStart.x) / rayDirection.x;
    // Swap to keep t0 the smaller of the two.
    if (t0 > t1) {
        const tmp = t0;
        t0 = t1;
        t1 = tmp;
    }
    // Intersect the ray with the bottom and top planes.
    let ty0 = (boxMin.y - rayStart.y) / rayDirection.y;
    let ty1 = (boxMax.y - rayStart.y) / rayDirection.y;
    if (ty0 > ty1) {
        const tmp = ty0;
        ty0 = ty1;
        ty1 = tmp;
    }
    // If we've exited one dimension before starting another, bail.
    if (t0 > ty1 || ty0 > t1)
        return [];
    // Keep greater t*0 and smaller t*1.
    if (ty0 > t0)
        t0 = ty0;
    if (ty1 < t1)
        t1 = ty1;
    // Intersect the ray with the near and far planes.
    let tz0 = (boxMin.z - rayStart.z) / rayDirection.z;
    let tz1 = (boxMax.z - rayStart.z) / rayDirection.z;
    if (tz0 > tz1) {
        const tmp = tz0;
        tz0 = tz1;
        tz1 = tmp;
    }
    // If we've exited one dimension before starting another, bail.
    if (t0 > tz1 || tz0 > t1)
        return [];
    // Keep greater t*0 and smaller t*1.
    if (tz0 > t0)
        t0 = tz0;
    if (tz1 < t1)
        t1 = tz1;
    // Locate two points on ray.
    return [
        rayStart.add(rayDirection.multiplyScalar(t0)),
        rayStart.add(rayDirection.multiplyScalar(t1)),
    ];
}
export function intersectRayPyramid(rayStart, rayDirection, baseSize, height) {
    const intersections = [];
    // Pyramid with square base centered at origin
    // Base at y = -height/2, apex at y = height/2
    const halfBase = baseSize / 2;
    const halfHeight = height / 2;
    // Test intersection with base (y = -halfHeight plane)
    if (Math.abs(rayDirection.y) > 0.0001) {
        const t = (-halfHeight - rayStart.y) / rayDirection.y;
        if (t >= 0) {
            const p = rayStart.add(rayDirection.multiplyScalar(t));
            if (Math.abs(p.x) <= halfBase && Math.abs(p.z) <= halfBase) {
                intersections.push(p);
            }
        }
    }
    // Test intersection with each of the 4 triangular faces
    // Each face is a plane defined by the apex and two base corners
    const apex = new Vector3(0, halfHeight, 0);
    const baseCorners = [
        new Vector3(-halfBase, -halfHeight, -halfBase),
        new Vector3(halfBase, -halfHeight, -halfBase),
        new Vector3(halfBase, -halfHeight, halfBase),
        new Vector3(-halfBase, -halfHeight, halfBase)
    ];
    for (let i = 0; i < 4; i++) {
        const corner1 = baseCorners[i];
        const corner2 = baseCorners[(i + 1) % 4];
        // Compute plane normal using cross product
        const edge1 = corner1.subtract(apex);
        const edge2 = corner2.subtract(apex);
        const normal = edge1.cross(edge2).normalize();
        // Ray-plane intersection
        const denom = rayDirection.dot(normal);
        if (Math.abs(denom) > 0.0001) {
            const t = apex.subtract(rayStart).dot(normal) / denom;
            if (t >= 0) {
                const p = rayStart.add(rayDirection.multiplyScalar(t));
                // Check if point is inside the triangle (apex, corner1, corner2)
                // Using barycentric coordinates
                const v0 = corner2.subtract(apex);
                const v1 = corner1.subtract(apex);
                const v2 = p.subtract(apex);
                const dot00 = v0.dot(v0);
                const dot01 = v0.dot(v1);
                const dot02 = v0.dot(v2);
                const dot11 = v1.dot(v1);
                const dot12 = v1.dot(v2);
                const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
                const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
                if (u >= 0 && v >= 0 && u + v <= 1) {
                    // Check if this intersection point is unique
                    const isUnique = intersections.every(existing => existing.subtract(p).magnitude > 0.0001);
                    if (isUnique) {
                        intersections.push(p);
                    }
                }
            }
        }
    }
    return intersections;
}
export function intersectRayCone(rayStart, rayDirection, topRadius, bottomRadius, height) {
    const intersections = [];
    // Cone centered at origin, base at y = -height/2, top at y = height/2
    const halfHeight = height / 2;
    // For a cone, radius changes linearly with y
    // At y = -halfHeight: radius = bottomRadius
    // At y = halfHeight: radius = topRadius
    // r(y) = bottomRadius + (topRadius - bottomRadius) * (y + halfHeight) / height
    // Cone implicit equation: x² + z² = r(y)²
    // Expanding: x² + z² = [bottomRadius + (topRadius - bottomRadius) * (y + halfHeight) / height]²
    const dx = rayDirection.x;
    const dy = rayDirection.y;
    const dz = rayDirection.z;
    const ox = rayStart.x;
    const oy = rayStart.y;
    const oz = rayStart.z;
    // Let k = (topRadius - bottomRadius) / height
    const k = (topRadius - bottomRadius) / height;
    // r(y) = k * (y + halfHeight) + bottomRadius
    //      = k * y + k * halfHeight + bottomRadius
    // Substitute ray equation p = o + t*d into cone equation
    // (ox + t*dx)² + (oz + t*dz)² = [k*(oy + t*dy) + k*halfHeight + bottomRadius]²
    // Expanding left side: ox² + 2*ox*t*dx + t²*dx² + oz² + 2*oz*t*dz + t²*dz²
    // Expanding right side: [k*oy + k*t*dy + k*halfHeight + bottomRadius]²
    const r0 = k * halfHeight + bottomRadius; // radius at y=0
    // Quadratic form: at² + bt + c = 0
    const a = dx * dx + dz * dz - k * k * dy * dy;
    const b = 2 * (ox * dx + oz * dz - k * k * dy * oy - k * dy * r0);
    const c = ox * ox + oz * oz - (k * oy + r0) * (k * oy + r0);
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0 && Math.abs(a) > 0.0001) {
        const sqrtDisc = Math.sqrt(discriminant);
        const t0 = (-b - sqrtDisc) / (2 * a);
        const t1 = (-b + sqrtDisc) / (2 * a);
        // Check both intersection points
        for (const t of [t0, t1]) {
            if (t >= 0) {
                const p = rayStart.add(rayDirection.multiplyScalar(t));
                // Check if point is within cone height
                if (p.y >= -halfHeight - 0.001 && p.y <= halfHeight + 0.001) {
                    intersections.push(p);
                }
            }
        }
    }
    // Test intersection with top cap (if topRadius > 0)
    if (topRadius > 0.0001 && Math.abs(rayDirection.y) > 0.0001) {
        const t = (halfHeight - rayStart.y) / rayDirection.y;
        if (t >= 0) {
            const p = rayStart.add(rayDirection.multiplyScalar(t));
            const distFromCenter = Math.sqrt(p.x * p.x + p.z * p.z);
            if (distFromCenter <= topRadius + 0.001) {
                const isUnique = intersections.every(existing => existing.subtract(p).magnitude > 0.001);
                if (isUnique) {
                    intersections.push(p);
                }
            }
        }
    }
    // Test intersection with bottom cap
    if (Math.abs(rayDirection.y) > 0.0001) {
        const t = (-halfHeight - rayStart.y) / rayDirection.y;
        if (t >= 0) {
            const p = rayStart.add(rayDirection.multiplyScalar(t));
            const distFromCenter = Math.sqrt(p.x * p.x + p.z * p.z);
            if (distFromCenter <= bottomRadius + 0.001) {
                const isUnique = intersections.every(existing => existing.subtract(p).magnitude > 0.001);
                if (isUnique) {
                    intersections.push(p);
                }
            }
        }
    }
    return intersections;
}
export function intersectRayTetrahedron(rayStart, rayDirection, size) {
    const intersections = [];
    // Regular tetrahedron centered at origin
    // Using standard tetrahedron vertices
    const h = size * Math.sqrt(2 / 3); // height from base to apex
    const r = size * Math.sqrt(3) / 3; // radius of base circle
    const vertices = [
        new Vector3(0, h / 2, 0), // apex (top)
        new Vector3(r, -h / 2, 0), // base vertex 1
        new Vector3(-r / 2, -h / 2, r * Math.sqrt(3) / 2), // base vertex 2
        new Vector3(-r / 2, -h / 2, -r * Math.sqrt(3) / 2) // base vertex 3
    ];
    // Four triangular faces
    const faces = [
        [0, 2, 1], // face 1
        [0, 3, 2], // face 2
        [0, 1, 3], // face 3
        [1, 2, 3] // base
    ];
    for (const face of faces) {
        const v0 = vertices[face[0]];
        const v1 = vertices[face[1]];
        const v2 = vertices[face[2]];
        // Compute plane normal using cross product
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const normal = edge1.cross(edge2).normalize();
        // Ray-plane intersection
        const denom = rayDirection.dot(normal);
        if (Math.abs(denom) > 0.0001) {
            const t = v0.subtract(rayStart).dot(normal) / denom;
            if (t >= 0) {
                const p = rayStart.add(rayDirection.multiplyScalar(t));
                // Check if point is inside the triangle using barycentric coordinates
                const vp = p.subtract(v0);
                const dot00 = edge2.dot(edge2);
                const dot01 = edge2.dot(edge1);
                const dot02 = edge2.dot(vp);
                const dot11 = edge1.dot(edge1);
                const dot12 = edge1.dot(vp);
                const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
                const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
                if (u >= -0.001 && v >= -0.001 && u + v <= 1.001) {
                    // Check if this intersection point is unique
                    const isUnique = intersections.every(existing => existing.subtract(p).magnitude > 0.001);
                    if (isUnique) {
                        intersections.push(p);
                    }
                }
            }
        }
    }
    return intersections;
}
export function intersectRayOctahedron(rayStart, rayDirection, size) {
    const intersections = [];
    // Regular octahedron centered at origin
    // 6 vertices at unit distance from center along axes
    const s = size / Math.sqrt(2); // scale factor
    const vertices = [
        new Vector3(s, 0, 0), // +X
        new Vector3(-s, 0, 0), // -X
        new Vector3(0, s, 0), // +Y (top)
        new Vector3(0, -s, 0), // -Y (bottom)
        new Vector3(0, 0, s), // +Z
        new Vector3(0, 0, -s) // -Z
    ];
    // 8 triangular faces (4 on top pyramid, 4 on bottom pyramid)
    const faces = [
        // Top pyramid (apex at +Y)
        [2, 0, 4], // top, +X, +Z
        [2, 4, 1], // top, +Z, -X
        [2, 1, 5], // top, -X, -Z
        [2, 5, 0], // top, -Z, +X
        // Bottom pyramid (apex at -Y)
        [3, 4, 0], // bottom, +Z, +X
        [3, 1, 4], // bottom, -X, +Z
        [3, 5, 1], // bottom, -Z, -X
        [3, 0, 5] // bottom, +X, -Z
    ];
    for (const face of faces) {
        const v0 = vertices[face[0]];
        const v1 = vertices[face[1]];
        const v2 = vertices[face[2]];
        // Compute plane normal using cross product
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const normal = edge1.cross(edge2).normalize();
        // Ray-plane intersection
        const denom = rayDirection.dot(normal);
        if (Math.abs(denom) > 0.0001) {
            const t = v0.subtract(rayStart).dot(normal) / denom;
            if (t >= 0) {
                const p = rayStart.add(rayDirection.multiplyScalar(t));
                // Check if point is inside the triangle using barycentric coordinates
                const vp = p.subtract(v0);
                const dot00 = edge2.dot(edge2);
                const dot01 = edge2.dot(edge1);
                const dot02 = edge2.dot(vp);
                const dot11 = edge1.dot(edge1);
                const dot12 = edge1.dot(vp);
                const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
                const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
                if (u >= -0.001 && v >= -0.001 && u + v <= 1.001) {
                    // Check if this intersection point is unique
                    const isUnique = intersections.every(existing => existing.subtract(p).magnitude > 0.001);
                    if (isUnique) {
                        intersections.push(p);
                    }
                }
            }
        }
    }
    return intersections;
}
export function intersectRayDodecahedron(rayStart, rayDirection, size) {
    const intersections = [];
    // Regular dodecahedron centered at origin
    // A dodecahedron has 20 vertices, 12 pentagonal faces
    const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
    const scale = size / (2 * phi);
    // 20 vertices of a dodecahedron
    const vertices = [
        // (1, 1, 1)
        new Vector3(1, 1, 1).multiplyScalar(scale),
        new Vector3(1, 1, -1).multiplyScalar(scale),
        new Vector3(1, -1, 1).multiplyScalar(scale),
        new Vector3(1, -1, -1).multiplyScalar(scale),
        new Vector3(-1, 1, 1).multiplyScalar(scale),
        new Vector3(-1, 1, -1).multiplyScalar(scale),
        new Vector3(-1, -1, 1).multiplyScalar(scale),
        new Vector3(-1, -1, -1).multiplyScalar(scale),
        // (0, 1/f, f)
        new Vector3(0, 1 / phi, phi).multiplyScalar(scale),
        new Vector3(0, 1 / phi, -phi).multiplyScalar(scale),
        new Vector3(0, -1 / phi, phi).multiplyScalar(scale),
        new Vector3(0, -1 / phi, -phi).multiplyScalar(scale),
        // (1/f, f, 0)
        new Vector3(1 / phi, phi, 0).multiplyScalar(scale),
        new Vector3(1 / phi, -phi, 0).multiplyScalar(scale),
        new Vector3(-1 / phi, phi, 0).multiplyScalar(scale),
        new Vector3(-1 / phi, -phi, 0).multiplyScalar(scale),
        // (f, 0, 1/f)
        new Vector3(phi, 0, 1 / phi).multiplyScalar(scale),
        new Vector3(phi, 0, -1 / phi).multiplyScalar(scale),
        new Vector3(-phi, 0, 1 / phi).multiplyScalar(scale),
        new Vector3(-phi, 0, -1 / phi).multiplyScalar(scale)
    ];
    // 12 pentagonal faces - each face is defined by 5 vertex indices
    const faces = [
        [0, 8, 10, 2, 16],
        [0, 16, 17, 1, 12],
        [0, 12, 14, 4, 8],
        [1, 17, 3, 11, 9],
        [1, 9, 5, 14, 12],
        [2, 10, 6, 15, 13],
        [2, 13, 3, 17, 16],
        [3, 13, 15, 7, 11],
        [4, 14, 5, 19, 18],
        [4, 18, 6, 10, 8],
        [5, 9, 11, 7, 19],
        [6, 18, 19, 7, 15]
    ];
    // Test each pentagonal face by splitting into triangles
    for (const face of faces) {
        // Split pentagon into 3 triangles from first vertex
        const triangles = [
            [face[0], face[1], face[2]],
            [face[0], face[2], face[3]],
            [face[0], face[3], face[4]]
        ];
        for (const triangle of triangles) {
            const v0 = vertices[triangle[0]];
            const v1 = vertices[triangle[1]];
            const v2 = vertices[triangle[2]];
            // Compute plane normal using cross product
            const edge1 = v1.subtract(v0);
            const edge2 = v2.subtract(v0);
            const normal = edge1.cross(edge2).normalize();
            // Ray-plane intersection
            const denom = rayDirection.dot(normal);
            if (Math.abs(denom) > 0.0001) {
                const t = v0.subtract(rayStart).dot(normal) / denom;
                if (t >= 0) {
                    const p = rayStart.add(rayDirection.multiplyScalar(t));
                    // Check if point is inside the triangle using barycentric coordinates
                    const vp = p.subtract(v0);
                    const dot00 = edge2.dot(edge2);
                    const dot01 = edge2.dot(edge1);
                    const dot02 = edge2.dot(vp);
                    const dot11 = edge1.dot(edge1);
                    const dot12 = edge1.dot(vp);
                    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
                    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
                    if (u >= -0.001 && v >= -0.001 && u + v <= 1.001) {
                        // Check if this intersection point is unique
                        const isUnique = intersections.every(existing => existing.subtract(p).magnitude > 0.001);
                        if (isUnique) {
                            intersections.push(p);
                        }
                    }
                }
            }
        }
    }
    return intersections;
}
export function intersectRayIcosahedron(rayStart, rayDirection, size) {
    const intersections = [];
    // Regular icosahedron centered at origin
    // An icosahedron has 12 vertices, 20 triangular faces
    const phi = (1 + Math.sqrt(5)) / 2; // golden ratio
    const scale = size / 2;
    // 12 vertices of an icosahedron
    const vertices = [
        // Rectangle in XY plane
        new Vector3(-1, phi, 0).normalize().multiplyScalar(scale),
        new Vector3(1, phi, 0).normalize().multiplyScalar(scale),
        new Vector3(-1, -phi, 0).normalize().multiplyScalar(scale),
        new Vector3(1, -phi, 0).normalize().multiplyScalar(scale),
        // Rectangle in YZ plane
        new Vector3(0, -1, phi).normalize().multiplyScalar(scale),
        new Vector3(0, 1, phi).normalize().multiplyScalar(scale),
        new Vector3(0, -1, -phi).normalize().multiplyScalar(scale),
        new Vector3(0, 1, -phi).normalize().multiplyScalar(scale),
        // Rectangle in XZ plane
        new Vector3(phi, 0, -1).normalize().multiplyScalar(scale),
        new Vector3(phi, 0, 1).normalize().multiplyScalar(scale),
        new Vector3(-phi, 0, -1).normalize().multiplyScalar(scale),
        new Vector3(-phi, 0, 1).normalize().multiplyScalar(scale)
    ];
    // 20 triangular faces
    const faces = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    // Test each triangular face
    for (const face of faces) {
        const v0 = vertices[face[0]];
        const v1 = vertices[face[1]];
        const v2 = vertices[face[2]];
        // Compute plane normal using cross product
        const edge1 = v1.subtract(v0);
        const edge2 = v2.subtract(v0);
        const normal = edge1.cross(edge2).normalize();
        // Ray-plane intersection
        const denom = rayDirection.dot(normal);
        if (Math.abs(denom) > 0.0001) {
            const t = v0.subtract(rayStart).dot(normal) / denom;
            if (t >= 0) {
                const p = rayStart.add(rayDirection.multiplyScalar(t));
                // Check if point is inside the triangle using barycentric coordinates
                const vp = p.subtract(v0);
                const dot00 = edge2.dot(edge2);
                const dot01 = edge2.dot(edge1);
                const dot02 = edge2.dot(vp);
                const dot11 = edge1.dot(edge1);
                const dot12 = edge1.dot(vp);
                const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
                const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
                const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
                if (u >= -0.001 && v >= -0.001 && u + v <= 1.001) {
                    // Check if this intersection point is unique
                    const isUnique = intersections.every(existing => existing.subtract(p).magnitude > 0.001);
                    if (isUnique) {
                        intersections.push(p);
                    }
                }
            }
        }
    }
    return intersections;
}
