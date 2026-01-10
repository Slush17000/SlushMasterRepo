import { lerp } from "./math-utilities.js";

export class Vector3 {
    xyz: number[];

    constructor(x: number, y: number, z: number) {
        this.xyz = [x, y, z];
    }

    get x() {
        return this.xyz[0];
    }

    get y() {
        return this.xyz[1];
    }

    get z() {
        return this.xyz[2];
    }

    set x(value: number) {
        this.xyz[0] = value;
    }

    set y(value: number) {
        this.xyz[1] = value;
    }

    set z(value: number) {
        this.xyz[2] = value;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    get magnitude() {
        return Math.sqrt(this.x * this.x +
            this.y * this.y +
            this.z * this.z);
    }

    inverse() {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    toString() {
        return `[${this.x}, ${this.y}, ${this.z}]`;
    }

    addScalar(factor: number) {
        return new Vector3(this.x + factor,
            this.y + factor,
            this.z + factor);
    }

    subtractScalar(factor: number) {
        return new Vector3(this.x - factor,
            this.y - factor,
            this.z - factor);
    }

    multiplyScalar(factor: number) {
        return new Vector3(this.x * factor,
            this.y * factor,
            this.z * factor);
    }

    divideScalar(factor: number) {
        return new Vector3(this.x / factor,
            this.y / factor,
            this.z / factor);
    }

    add(that: Vector3) {
        return new Vector3(this.x + that.x,
            this.y + that.y,
            this.z + that.z);
    }

    subtract(that: Vector3) {
        return new Vector3(this.x - that.x,
            this.y - that.y,
            this.z - that.z);
    }

    multiply(factors: Vector3) {
        return new Vector3(this.x * factors.x,
            this.y * factors.y,
            this.z * factors.z);
    }

    divide(factors: Vector3) {
        return new Vector3(this.x / factors.x,
            this.y / factors.y,
            this.z / factors.z);
    }

    normalize() {
        let mag = this.magnitude;
        if (mag === 0) {
            throw "Can't normalize the zero vector.";
        }
        return new Vector3(this.x / mag,
            this.y / mag,
            this.z / mag);
    }

    dot(that: Vector3) {
        return this.x * that.x +
            this.y * that.y +
            this.z * that.z;
    }

    cross(that: Vector3) {
        return new Vector3(
            this.y * that.z - this.z * that.y,
            this.z * that.x - this.x * that.z,
            this.x * that.y - this.y * that.x);
    }

    lerp(that: Vector3, blend: number) {
        return new Vector3(
            lerp(this.x, that.x, blend),
            lerp(this.y, that.y, blend),
            lerp(this.z, that.z, blend)
        );
    }
}

export class Vector4 {
    xyzw: number[];

    constructor(x: number, y: number, z: number, w: number) {
        this.xyzw = [x, y, z, w];
    }

    get x() {
        return this.xyzw[0];
    }

    get y() {
        return this.xyzw[1];
    }

    get z() {
        return this.xyzw[2];
    }

    get w() {
        return this.xyzw[3];
    }

    set x(value: number) {
        this.xyzw[0] = value;
    }

    set y(value: number) {
        this.xyzw[1] = value;
    }

    set z(value: number) {
        this.xyzw[2] = value;
    }

    set w(value: number) {
        this.xyzw[3] = value;
    }

    clone() {
        return new Vector4(this.x, this.y, this.z, this.w);
    }

    get magnitude() {
        return Math.sqrt(this.x * this.x +
            this.y * this.y +
            this.z * this.z +
            this.w * this.w);
    }

    inverse() {
        return new Vector4(-this.x, -this.y, -this.z, -this.w);
    }

    toString() {
        return `[${this.x}, ${this.y}, ${this.z}, ${this.w}]`;
    }

    addScalar(factor: number) {
        return new Vector4(this.x + factor,
            this.y + factor,
            this.z + factor,
            this.w + factor);
    }

    subtractScalar(factor: number) {
        return new Vector4(this.x - factor,
            this.y - factor,
            this.z - factor,
            this.w - factor);
    }

    multiplyScalar(factor: number) {
        return new Vector4(this.x * factor,
            this.y * factor,
            this.z * factor,
            this.w * factor);
    }

    divideScalar(factor: number) {
        return new Vector4(this.x / factor,
            this.y / factor,
            this.z / factor,
            this.w / factor);
    }

    add(that: Vector4) {
        return new Vector4(this.x + that.x,
            this.y + that.y,
            this.z + that.z,
            this.w + that.w);
    }

    subtract(that: Vector4) {
        return new Vector4(this.x - that.x,
            this.y - that.y,
            this.z - that.z,
            this.w - that.w);
    }

    multiply(factors: Vector4) {
        return new Vector4(this.x * factors.x,
            this.y * factors.y,
            this.z * factors.z,
            this.w * factors.w);
    }

    divide(factors: Vector4) {
        return new Vector4(this.x / factors.x,
            this.y / factors.y,
            this.z / factors.z,
            this.w / factors.w);
    }

    normalize() {
        let mag = this.magnitude;
        if (mag === 0) {
            throw "Can't normalize the zero vector.";
        }
        return new Vector4(this.x / mag,
            this.y / mag,
            this.z / mag,
            this.w / mag);
    }

    dot(that: Vector4) {
        return this.x * that.x +
            this.y * that.y +
            this.z * that.z +
            this.w * that.w;
    }

    cross(that: Vector4) {
        return new Vector4(
            this.y * that.z - this.z * that.y,
            this.z * that.x - this.x * that.z,
            this.x * that.y - this.y * that.x,
            0);
    }

    lerp(that: Vector4, blend: number) {
        return new Vector4(
            lerp(this.x, that.x, blend),
            lerp(this.y, that.y, blend),
            lerp(this.z, that.z, blend),
            lerp(this.w, that.w, blend)
        );
    }
}
