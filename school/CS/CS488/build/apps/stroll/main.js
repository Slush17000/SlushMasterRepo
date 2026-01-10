import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3 } from 'lib/vector.js';
import { TerrainCamera } from 'lib/camera.js';
import { Prefab } from 'lib/prefab.js';
import { Field2 } from 'lib/field.js';
import { fetchImage } from 'lib/web-utilities.js';
let canvas;
let shaderProgram;
let sunShaderProgram;
let vaoGltf;
let sunVao;
let clipFromEye;
let camera;
let worldFromModel;
let then = null;
let lightPosition = new Vector3(250, 100, 250);
// Camera movement parameters
let moveSpeed = 0.05; // units per millisecond
const lookSpeed = 0.16; // degrees per millisecond
const deadzone = 0.15; // Joystick deadzone to prevent drift
const speedIncrement = 0.3; // Amount to increase speed per button press
// Key state tracking
const keys = {};
let heightField;
let factors;
let currentHeightMap;
async function loadHeightMap(heightMapPath) {
    const heightmapImage = await fetchImage(heightMapPath);
    heightField = Field2.readFromImage(heightmapImage);
    // Use different height scaling for mountains vs other terrain
    const isMountain = heightMapPath.includes('everest') ||
        heightMapPath.includes('fuji') ||
        heightMapPath.includes('kilimanjaro') ||
        heightMapPath.includes('matterhorn');
    const heightScale = isMountain ? 250 : 50;
    factors = new Vector3(1, heightScale, 1);
    const mesh = heightField.toTrimesh(factors);
    mesh.computeNormals();
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', mesh.vertexCount, 3, mesh.positionBuffer);
    attributes.addAttribute('normal', mesh.vertexCount, 3, mesh.normalBuffer);
    attributes.addIndices(mesh.faceBuffer);
    // Dispose old VAO if it exists
    if (vaoGltf) {
        vaoGltf.unbind();
    }
    vaoGltf = new VertexArray(shaderProgram, attributes);
    // Create sun sphere if it doesn't exist yet
    if (!sunVao) {
        const sphereMesh = Prefab.sphere(10, 6, 6);
        sphereMesh.computeNormals();
        const sunAttributes = new VertexAttributes();
        sunAttributes.addAttribute('position', sphereMesh.vertexCount, 3, sphereMesh.positionBuffer);
        sunAttributes.addAttribute('normal', sphereMesh.vertexCount, 3, sphereMesh.normalBuffer);
        sunAttributes.addIndices(sphereMesh.faceBuffer);
        sunVao = new VertexArray(sunShaderProgram, sunAttributes);
    }
    // Reset camera position for new terrain
    const cameraPosition = new Vector3(250, 200, 250);
    const lookAtPoint = new Vector3(200, 0, -100);
    const offset = 5;
    camera = new TerrainCamera(cameraPosition, lookAtPoint, heightField, offset, factors);
    resizeCanvas();
}
function setupHeightMapButtons() {
    const buttons = document.querySelectorAll('.heightmap-button');
    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const heightMapPath = button.getAttribute('data-heightmap');
            if (heightMapPath && heightMapPath !== currentHeightMap) {
                currentHeightMap = heightMapPath;
                // Update active button
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                // Load new height map
                await loadHeightMap(heightMapPath);
            }
        });
    });
}
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    // Create sun shader program
    const sunVertexSource = await fetchText('sun-vertex.glsl');
    const sunFragmentSource = await fetchText('sun-fragment.glsl');
    sunShaderProgram = new ShaderProgram(sunVertexSource, sunFragmentSource);
    // load heightmap
    currentHeightMap = './height-maps/everestHeightMap.png';
    await loadHeightMap(currentHeightMap);
    // Set up height map buttons
    setupHeightMapButtons();
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Only lock pointer when clicking on canvas
    canvas.addEventListener('pointerdown', () => {
        document.body.requestPointerLock();
    });
    // Unlock pointer with Escape key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.pointerLockElement) {
            document.exitPointerLock();
        }
    });
    window.addEventListener('pointermove', event => {
        if (document.pointerLockElement) {
            const currentPitch = Math.asin(camera.forward.y) * 180 / Math.PI;
            const pitchDelta = -event.movementY * lookSpeed / 2.3;
            if ((pitchDelta > 0 && currentPitch < 85) || (pitchDelta < 0 && currentPitch > -85)) {
                camera.pitch(pitchDelta);
            }
            camera.yaw(-event.movementX * lookSpeed / 2.3);
            render();
        }
    });
    // Gamepad event listeners
    window.addEventListener("gamepadconnected", (e) => {
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
    });
    window.addEventListener("gamepaddisconnected", (e) => {
        console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
    });
    resizeCanvas();
    // start the animation loop
    requestAnimationFrame(animate);
}
function handleKeyDown(event) {
    keys[event.key.toLowerCase()] = true;
}
function handleKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}
let currentPitch = 0;
let bButtonWasPressed = false; // Track button state to detect press (not hold)
function updateCamera(elapsed) {
    // Keyboard controls - WASD for movement
    if (keys['w'])
        camera.advance(elapsed * moveSpeed);
    if (keys['s'])
        camera.advance(-elapsed * moveSpeed);
    if (keys['a'])
        camera.strafe(-elapsed * moveSpeed);
    if (keys['d'])
        camera.strafe(elapsed * moveSpeed);
    currentPitch = Math.asin(camera.forward.y) * 180 / Math.PI;
    if (keys['arrowdown'] && currentPitch > -85)
        camera.pitch(-elapsed * lookSpeed);
    if (keys['arrowup'] && currentPitch < 85)
        camera.pitch(elapsed * lookSpeed);
    // QE for yaw
    if (keys['arrowleft'])
        camera.yaw(elapsed * lookSpeed);
    if (keys['arrowright'])
        camera.yaw(-elapsed * lookSpeed);
    // Gamepad controls - check first connected gamepad
    const gamepad = navigator.getGamepads()[0];
    if (gamepad) {
        // B button (button 1 on most controllers) - increase speed
        const bButton = gamepad.buttons[1];
        if (bButton.pressed) {
            moveSpeed = speedIncrement;
        }
        else {
            moveSpeed = 0.05; // Reset to default speed when not pressed
        }
        bButtonWasPressed = bButton.pressed;
        // Left stick: axes[0] = left/right (strafe), axes[1] = up/down (advance)
        const leftStickX = gamepad.axes[0];
        const leftStickY = gamepad.axes[1];
        // Right stick: axes[2] = left/right (yaw), axes[3] = up/down (pitch)
        const rightStickX = gamepad.axes[2];
        const rightStickY = gamepad.axes[3];
        // Apply movement with deadzone
        if (Math.abs(leftStickX) > deadzone) {
            camera.strafe(leftStickX * elapsed * moveSpeed);
        }
        if (Math.abs(leftStickY) > deadzone) {
            camera.advance(-leftStickY * elapsed * moveSpeed); // Inverted for forward/back
        }
        // Apply look with deadzone
        if (Math.abs(rightStickX) > deadzone) {
            camera.yaw(-rightStickX * elapsed * lookSpeed);
        }
        if (Math.abs(rightStickY) > deadzone) {
            const pitchDegrees = -rightStickY * elapsed * lookSpeed;
            if ((pitchDegrees > 0 && currentPitch < 85) || (pitchDegrees < 0 && currentPitch > -85)) {
                camera.pitch(pitchDegrees);
            }
        }
    }
}
function animate(now) {
    const elapsed = then ? now - then : 0;
    const lightTime = now / 1000;
    const lightPosX = 250 + 150 * Math.sin(lightTime);
    const lightPosZ = 250 + 150 * Math.cos(lightTime);
    lightPosition = new Vector3(lightPosX, 350, lightPosZ);
    updateCamera(elapsed);
    render();
    requestAnimationFrame(animate);
    then = now;
}
function render() {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Martian sky
    // gl.clearColor(0.4, 0.3, 0.2, 1.0);
    // Blue sky
    gl.clearColor(0.0, 0.75, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    // Render the sun
    sunShaderProgram.bind();
    // Create transformation matrix for the sun
    const worldFromSun = Matrix4.translate(lightPosition.x, lightPosition.y, lightPosition.z);
    // Upload transformation matrices for the sun
    sunShaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    sunShaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
    sunShaderProgram.setUniformMatrix4fv('worldFromModel', worldFromSun.elements);
    sunVao.bind();
    sunVao.drawIndexed(gl.TRIANGLES);
    sunVao.unbind();
    sunShaderProgram.unbind();
    // Render the terrain
    shaderProgram.bind();
    worldFromModel = Matrix4.identity();
    // Pass the three matrices as separate uniforms
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);
    // Set light position in world space
    shaderProgram.setUniform3f('lightPositionWorld', lightPosition.x, lightPosition.y, lightPosition.z);
    shaderProgram.setUniform3f('cameraPositionWorld', camera.from.x, camera.from.y, camera.from.z);
    shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
    shaderProgram.setUniform3f('specularColor', 0, 0, 0);
    shaderProgram.setUniform1f('ambientFactor', 0.15);
    shaderProgram.setUniform1f('shininess', 1.0);
    // Martian mountain color
    // shaderProgram.setUniform3f('albedo', 0.4, 0.2, 0.1);
    // Earthy mountain
    // shaderProgram.setUniform3f('albedo', 0.4, 0.4, 0.4);
    // Yellow desert
    shaderProgram.setUniform3f('albedo', 0.8, 0.7, 0.2);
    vaoGltf.bind();
    vaoGltf.drawIndexed(gl.TRIANGLES);
    vaoGltf.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    const fovY = 75;
    const near = 0.1;
    const far = 1000;
    clipFromEye = Matrix4.perspective(fovY, aspectRatio, near, far);
    render();
}
window.addEventListener('load', () => initialize());
