import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import * as gltf from 'lib/gltf.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3 } from 'lib/vector.js';
let canvas;
let shaderProgram;
let vao;
let clipFromEye;
let eyeFromWorld;
let worldFromPose;
let then = null;
let model;
// Rotation state
let rotationX = 0; // pitch
let rotationY = Math.PI; // yaw - start rotated 180 degrees
// Position state
let positionX = 0;
let positionY = -0.5;
const moveSpeed = 0.002;
// Key state tracking
const keys = {};
// Mouse drag state
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartRotationX = 0;
let dragStartRotationY = 0;
const dragSensitivity = 0.005;
// Zoom state
let cameraDistance = 8.0;
const minDistance = 2.0;
const maxDistance = 30.0;
const zoomSensitivity = 0.001;
// Light position
let lightPosition = new Vector3(5, 5, 5);
// Color mode: 0 = albedo, 1 = vertex colors
let useVertexColor = 1; // Default - vertex colors
// Current albedo color (default - red)
let currentAlbedo = { r: 1.0, g: 0.0, b: 0.0 };
// Background color (default - black)
let backgroundColor = { r: 0.0, g: 0.0, b: 0.0 };
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    await initializeModel('../../models/purpleGuy.gltf');
    // Get the joint count and replace the placeholder in the shader
    const jointCount = model.skinTransforms(0).length;
    const vertexSource = (await fetchText('flat-vertex.glsl')).replace('JOINT_TRANSFORM_COUNT', jointCount.toString());
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    // Create VAO with the shader program
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', model.meshes[0].positions.count, 3, model.meshes[0].positions.buffer);
    attributes.addAttribute('normal', model.meshes[0].normals.count, 3, model.meshes[0].normals.buffer);
    attributes.addAttribute('color', model.meshes[0].colors.count, 3, model.meshes[0].colors.buffer);
    attributes.addAttribute('weights', model.meshes[0].weights.count, 4, model.meshes[0].weights.buffer);
    attributes.addAttribute('joints', model.meshes[0].joints.count, 4, new Float32Array(model.meshes[0].joints.buffer));
    attributes.addIndices(new Uint32Array(model.meshes[0].indices.buffer));
    vao = new VertexArray(shaderProgram, attributes);
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Mouse events for rotation and zoom
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    // Buttons
    const buttons = {
        red: { btn: document.getElementById('redBtn'), color: { r: 1.0, g: 0.0, b: 0.0 } },
        orange: { btn: document.getElementById('orangeBtn'), color: { r: 1.0, g: 0.5, b: 0.0 } },
        yellow: { btn: document.getElementById('yellowBtn'), color: { r: 1.0, g: 1.0, b: 0.0 } },
        green: { btn: document.getElementById('greenBtn'), color: { r: 0.0, g: 1.0, b: 0.0 } },
        blue: { btn: document.getElementById('blueBtn'), color: { r: 0.0, g: 0.0, b: 1.0 } },
        indigo: { btn: document.getElementById('indigoBtn'), color: { r: 0.29, g: 0.0, b: 0.51 } },
        violet: { btn: document.getElementById('violetBtn'), color: { r: 0.56, g: 0.0, b: 1.0 } },
        white: { btn: document.getElementById('whiteBtn'), color: { r: 1.0, g: 1.0, b: 1.0 } },
        grey: { btn: document.getElementById('greyBtn'), color: { r: 0.5, g: 0.5, b: 0.5 } },
        black: { btn: document.getElementById('blackBtn'), color: { r: 0.0, g: 0.0, b: 0.0 } }
    };
    const defaultBtn = document.getElementById('defaultBtn');
    const deactivateAllBtns = () => {
        defaultBtn.classList.remove('active');
        Object.values(buttons).forEach(b => b.btn.classList.remove('active'));
    };
    // Default button listener
    defaultBtn.addEventListener('click', () => {
        useVertexColor = 1;
        backgroundColor = { r: 0.0, g: 0.0, b: 0.0 };
        deactivateAllBtns();
        defaultBtn.classList.add('active');
        render();
    });
    // Color button listeners
    Object.entries(buttons).forEach(([key, { btn, color }]) => {
        btn.addEventListener('click', () => {
            useVertexColor = 0;
            currentAlbedo = color;
            // Set background to white for black albedo, black for all others
            backgroundColor = (key === 'black') ? { r: 1.0, g: 1.0, b: 1.0 } : { r: 0.0, g: 0.0, b: 0.0 };
            deactivateAllBtns();
            btn.classList.add('active');
            render();
        });
    });
    // Animation buttons and listeners
    const walkBtn = document.getElementById('walkBtn');
    const reachBtn = document.getElementById('reachBtn');
    walkBtn.addEventListener('click', () => {
        model.play('walk');
        console.log('Playing walk animation');
    });
    reachBtn.addEventListener('click', () => {
        model.play('reach');
        console.log('Playing reach animation');
    });
    worldFromPose = Matrix4.translate(positionX, positionY, 0);
    resizeCanvas();
    requestAnimationFrame(animate);
}
async function initializeModel(url) {
    model = await gltf.Model.readFromUrl(url);
    // Log available animations
    const animationNames = Object.keys(model.animations);
    for (let clip of animationNames) {
        console.log(`Available animation: ${clip}`);
    }
    // Default - walk animation
    console.log('Starting animation: walk');
    model.play('walk');
}
// Keyboard event handlers
function handleKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
}
function handleKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}
// Mouse event handlers
function onPointerDown(ev) {
    if (!canvas)
        return;
    dragging = true;
    dragStartX = ev.clientX;
    dragStartY = ev.clientY;
    dragStartRotationX = rotationX;
    dragStartRotationY = rotationY;
    try {
        canvas.setPointerCapture(ev.pointerId);
    }
    catch (e) { /* ignore */ }
}
function onPointerMove(ev) {
    if (!dragging)
        return;
    const dx = ev.clientX - dragStartX;
    const dy = ev.clientY - dragStartY;
    rotationY = dragStartRotationY - dx * dragSensitivity;
    rotationX = dragStartRotationX - dy * dragSensitivity;
}
function onPointerUp(ev) {
    if (!dragging)
        return;
    dragging = false;
    try {
        canvas.releasePointerCapture(ev.pointerId);
    }
    catch (e) { /* ignore */ }
}
function onWheel(ev) {
    ev.preventDefault();
    cameraDistance += ev.deltaY * zoomSensitivity;
    cameraDistance = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
    updateProjection();
    render();
}
function updateRotation(elapsed) {
    const rotationSpeed = 0.002;
    // Arrow key controls for rotation
    if (keys['arrowleft'])
        rotationY += elapsed * rotationSpeed;
    if (keys['arrowright'])
        rotationY -= elapsed * rotationSpeed;
    if (keys['arrowup'])
        rotationX += elapsed * rotationSpeed;
    if (keys['arrowdown'])
        rotationX -= elapsed * rotationSpeed;
    // WASD controls for position
    if (keys['a'])
        positionX -= elapsed * moveSpeed;
    if (keys['d'])
        positionX += elapsed * moveSpeed;
    if (keys['w'])
        positionY += elapsed * moveSpeed;
    if (keys['s'])
        positionY -= elapsed * moveSpeed;
    // Screen wrapping - calculate visible boundaries based on camera
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const fovY = 50;
    const halfHeight = cameraDistance * Math.tan((fovY * Math.PI / 180) / 2);
    const halfWidth = halfHeight * aspect;
    // Wrap horizontally (left/right with a/d keys)
    if (positionX > halfWidth) {
        positionX = -halfWidth;
    }
    else if (positionX < -halfWidth) {
        positionX = halfWidth;
    }
    // Wrap vertically (top/bottom with w/s keys)
    if (positionY > halfHeight) {
        positionY = -halfHeight;
    }
    else if (positionY < -halfHeight) {
        positionY = halfHeight;
    }
    // Update world transformation with rotation and position
    worldFromPose = Matrix4.translate(positionX, positionY, 0)
        .multiplyMatrix(Matrix4.rotateY(rotationY * 180.0 / Math.PI))
        .multiplyMatrix(Matrix4.rotateX(rotationX * 180.0 / Math.PI));
}
function animate(now) {
    const elapsed = then ? now - then : 0;
    model.tick(elapsed);
    updateRotation(elapsed);
    render();
    requestAnimationFrame(animate);
    then = now;
}
function render() {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(backgroundColor.r, backgroundColor.g, backgroundColor.b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    shaderProgram.bind();
    // Set camera matrices
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromPose', worldFromPose.elements);
    // Set bone matrices
    for (let [i, matrix] of model.skinTransforms(300).entries()) {
        shaderProgram.setUniformMatrix4fv(`jointTransforms[${i}]`, matrix.elements);
    }
    // Set lighting uniforms
    const lightPosEye = eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram.setUniform3f('lightPositionEye', lightPosEye.x, lightPosEye.y, lightPosEye.z);
    shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
    shaderProgram.setUniform3f('specularColor', 1.0, 1.0, 1.0);
    shaderProgram.setUniform1f('ambientFactor', 0.2);
    shaderProgram.setUniform1f('shininess', 50.0);
    shaderProgram.setUniform3f('albedo', currentAlbedo.r, currentAlbedo.g, currentAlbedo.b);
    shaderProgram.setUniform1i('useVertexColor', useVertexColor);
    // Draw the model
    vao.bind();
    vao.drawIndexed(gl.TRIANGLES);
    vao.unbind();
    shaderProgram.unbind();
}
function updateProjection() {
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const fovY = 50;
    const near = 0.1;
    const far = 1000;
    clipFromEye = Matrix4.perspective(fovY, aspect, near, far);
    eyeFromWorld = Matrix4.translate(0, 0, -cameraDistance);
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    updateProjection();
    render();
}
window.addEventListener('load', () => initialize());
