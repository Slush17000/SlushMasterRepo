import { Matrix4 } from "./matrix.js";
import { Vector3 } from "./vector.js";
export class Trackball {
    constructor(dragSpeed = 1.0) {
        this.previousRotater = Matrix4.identity();
        this.rotater = Matrix4.identity();
        this.dragSpeed = dragSpeed;
    }
    setViewport(width, height, sphereRadiusPixels) {
        this.dimensions = new Vector3(width, height, 0);
        // If radius not provided, use the smaller dimension
        this.radius = sphereRadiusPixels ?? Math.min(width, height) / 2;
    }
    pixelToSphere(mousePixel) {
        // Center coordinates
        const center = new Vector3(this.dimensions.x / 2, this.dimensions.y / 2, 0);
        const relative = mousePixel.subtract(center);
        // Clamp to sphere radius in pixel space
        const distanceSquared = relative.x * relative.x + relative.y * relative.y;
        let x = relative.x;
        let y = -relative.y; // Flip y
        if (distanceSquared > this.radius * this.radius) {
            // Clamp to edge of sphere
            const distance = Math.sqrt(distanceSquared);
            x = (relative.x / distance) * this.radius;
            y = -(relative.y / distance) * this.radius; // Flip y
        }
        // Normalize to [-1, 1] range
        x /= this.radius;
        y /= this.radius;
        // Calculate z coordinate on sphere
        const zSquared = 1 - x * x - y * y;
        if (zSquared > 0) {
            return new Vector3(x, y, Math.sqrt(zSquared));
        }
        else {
            return new Vector3(x, y, 0);
        }
    }
    start(mousePixel) {
        this.mouseSphere0 = this.pixelToSphere(mousePixel);
    }
    drag(mousePixel) {
        const mouseSphereNow = this.pixelToSphere(mousePixel);
        const dot = this.mouseSphere0.dot(mouseSphereNow);
        if (Math.abs(dot) < 0.999999) {
            const axis = this.mouseSphere0.cross(mouseSphereNow);
            // Only apply rotation if the axis is not near zero
            if (axis.magnitude > 0.0001) {
                const radians = Math.acos(dot) * this.dragSpeed;
                const normalizedAxis = axis.normalize();
                const rotaterNow = Matrix4.rotateAround(normalizedAxis, radians * 180 / Math.PI);
                this.rotater = rotaterNow.multiplyMatrix(this.previousRotater);
            }
        }
    }
    end() {
        this.previousRotater = this.rotater;
    }
    cancel() {
        this.rotater = this.previousRotater;
    }
}
