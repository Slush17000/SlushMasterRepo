import { Vector3 } from './vector.js';
console.log(`Vector Tests:\n`);
// Initialize & toString Test
const vector = new Vector3(1, 2, 3);
console.log(`Vector 1: ${vector.toString()}\n`);
// Magnitude Test
const vector2 = new Vector3(4, 3, 12);
console.log(`Vector 2: ${vector2.toString()}`);
const mag = vector2.magnitude;
console.log(`Magnitude of Vector 2 is ${mag}\n`);
// Clone & Scale Test
const vector3 = vector2.clone();
console.log(`Vector 3 (Clone of Vector 2): ${vector3.toString()}`);
const vector4 = vector3.multiplyScalar(0.5);
console.log(`Vector 4 (Scaled Vector 3): ${vector4.toString()}`);
console.log(`Magnitude of Vector 4 is ${vector4.magnitude}\n`);
// Normalize Test
const vector5 = new Vector3(0, 0, 2);
console.log(`Vector 5: ${vector5.toString()}`);
const vector6 = vector5.normalize();
console.log(`Vector 6 (Normalized Vector 5): ${vector6.toString()}`);
console.log(`Magnitude of Vector 6 is ${vector6.magnitude}`);
const vector7 = new Vector3(0, 0, 4);
console.log(`Vector 7: ${vector7.toString()}`);
const vector8 = vector7.normalize();
console.log(`Vector 8 (Normalized Vector 7): ${vector8.toString()}`);
console.log(`Magnitude of Vector 8 is ${vector8.magnitude}\n`);
// Inverse & Magnitude Test
const vector9 = new Vector3(15, -23, -2);
console.log(`Vector 9: ${vector9.toString()}`);
const vector10 = vector9.inverse();
console.log(`Vector 10 (Inverse of Vector 9): ${vector10.toString()}`);
const vector11 = new Vector3(6, 7, -3);
console.log(`Vector 11: ${vector11.toString()}`);
const mag2 = vector11.magnitude;
console.log(`Magnitude of Vector 11 is ${mag2}\n`);
// Addition & Magnitude Test
const vector12 = new Vector3(0, 3, -1);
console.log(`Vector 12: ${vector12.toString()}`);
const vector13 = new Vector3(-3, 2, 0);
console.log(`Vector 13: ${vector13.toString()}`);
const vector14 = vector12.add(vector13);
console.log(`Vector 14 (Vector 12 + Vector 13): ${vector14.toString()}`);
const mag3 = vector14.magnitude;
console.log(`Magnitude of Vector 14 is ${mag3}\n`);
