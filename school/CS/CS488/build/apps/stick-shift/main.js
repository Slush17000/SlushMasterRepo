import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Gltf } from 'lib/static-gltf.js';
import { Matrix4 } from 'lib/matrix.js';
let canvas;
let shaderProgram;
let vaoGltf;
let clipFromWorld;
// Gamepad management
const gamepads = {};
const previousButtonStates = {};
const currentButtonStates = {};
let modelInstances = [];
let nextInstanceId = 0;
let then = null;
function gamepadHandler(event, connected) {
    const gamepad = event.gamepad;
    if (connected) {
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", event.gamepad.index, event.gamepad.id, event.gamepad.buttons.length, event.gamepad.axes.length);
        gamepads[gamepad.index] = gamepad;
        // Initialize button state tracking for this gamepad
        previousButtonStates[gamepad.index] = new Array(gamepad.buttons.length).fill(false);
        currentButtonStates[gamepad.index] = {};
        console.log(gamepads);
    }
    else {
        console.log("Gamepad disconnected from index %d: %s", event.gamepad.index, event.gamepad.id);
        delete gamepads[gamepad.index];
        delete previousButtonStates[gamepad.index];
        delete currentButtonStates[gamepad.index];
    }
}
async function initialize() {
    canvas = document.getElementById('canvas');
    window.gl = canvas.getContext('webgl2');
    const vertexSource = await fetchText('flat-vertex.glsl');
    const fragmentSource = await fetchText('flat-fragment.glsl');
    shaderProgram = new ShaderProgram(vertexSource, fragmentSource);
    await initializeModel();
    // Event listeners
    window.addEventListener('resize', () => resizeCanvas());
    // Keyboard fallback for testing when no gamepad is available
    window.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'b') {
            createModelInstance();
        }
    });
    // Gamepad event listeners
    window.addEventListener("gamepadconnected", (e) => {
        gamepadHandler(e, true);
    });
    window.addEventListener("gamepaddisconnected", (e) => {
        gamepadHandler(e, false);
    });
    resizeCanvas();
    render();
    // Start animation loop for gamepad input
    requestAnimationFrame(animate);
}
// Update gamepad button states
function updateGamepadStates() {
    for (const gamepad of navigator.getGamepads()) {
        if (!gamepad)
            continue;
        // Initialize if not exists
        if (!currentButtonStates[gamepad.index]) {
            currentButtonStates[gamepad.index] = {};
        }
        // Update button states
        for (const [i, button] of gamepad.buttons.entries()) {
            const wasPressed = previousButtonStates[gamepad.index][i];
            const isPressed = button.pressed;
            // Store current state
            currentButtonStates[gamepad.index][i] = {
                pressed: isPressed,
                value: button.value
            };
            // Regular button press/release logging for buttons
            if (isPressed && !wasPressed) {
                console.log(`Button ${i} [PRESSED]`);
                if (i === 1) { // B button - create new model instance
                    createModelInstance();
                }
            }
            else if (!isPressed && wasPressed) {
                console.log(`Button ${i} [RELEASED]`);
            }
            // Update previous state
            previousButtonStates[gamepad.index][i] = isPressed;
        }
    }
}
// Function to create a new model instance
function createModelInstance() {
    const newInstance = {
        id: nextInstanceId++,
        translateX: 0,
        translateY: 0,
        translateZ: 0,
        rotationY: 0,
        worldFromPose: Matrix4.identity()
    };
    modelInstances.push(newInstance);
    console.log(`Created model instance ${newInstance.id}. Total instances: ${modelInstances.length}`);
}
// Function to get the most recently added model instance
function getMostRecentInstance() {
    return modelInstances.length > 0 ? modelInstances[modelInstances.length - 1] : null;
}
function updateControls(elapsed) {
    let translateSpeed = 0.008;
    let rotationSpeed = 0.002;
    // Update gamepad button states first
    updateGamepadStates();
    // Gamepad controls - check all connected gamepads
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
        if (gamepad) {
            // Get the most recent model instance for joystick control
            const recentInstance = getMostRecentInstance();
            // Left joystick: axes[0] = left/right, axes[1] = up/down
            const leftStickX = gamepad.axes[0];
            const leftStickY = gamepad.axes[1];
            const rightStickX = gamepad.axes[2];
            const rightStickY = gamepad.axes[3];
            // Apply deadzone to avoid drift
            const deadzone = 0.2;
            if (recentInstance) {
                // Control the most recent model instance with joysticks
                if (Math.abs(leftStickX) > deadzone) {
                    recentInstance.translateX += leftStickX * translateSpeed * elapsed; // Left/right translation in XZ plane
                }
                if (Math.abs(leftStickY) > deadzone) {
                    recentInstance.translateZ += leftStickY * elapsed * translateSpeed * 2; // Forward/back translation in XZ plane
                }
                if (Math.abs(rightStickX) > deadzone) {
                    recentInstance.rotationY += rightStickX * elapsed * rotationSpeed * 2; // Rotation about Y-axis
                }
                if (Math.abs(rightStickY) > deadzone) {
                    recentInstance.translateY -= rightStickY * elapsed * translateSpeed * 2; // Y-axis translation (up/down)
                }
                // Update the world transformation matrix for this instance
                recentInstance.worldFromPose = Matrix4.translate(recentInstance.translateX, recentInstance.translateY, recentInstance.translateZ)
                    .multiplyMatrix(Matrix4.rotateY(recentInstance.rotationY * 180.0 / Math.PI));
            }
            break;
        }
    }
}
function animate(now) {
    const elapsed = then ? now - then : 0;
    updateControls(elapsed);
    render();
    requestAnimationFrame(animate);
    then = now;
}
async function initializeModel() {
    // Load a glTF model
    const model = await Gltf.readFromUrl('../../models/engine.gltf');
    const mesh = model.meshes[0];
    const attrsGltf = new VertexAttributes();
    attrsGltf.addAttribute('position', mesh.positions.count, 3, mesh.positions.buffer);
    attrsGltf.addAttribute('normal', model.meshes[0].normals.count, 3, model.meshes[0].normals.buffer);
    attrsGltf.addIndices(new Uint32Array(model.meshes[0].indices.buffer));
    vaoGltf = new VertexArray(shaderProgram, attrsGltf);
}
function render() {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    shaderProgram.bind();
    vaoGltf.bind();
    // Render all model instances
    for (const instance of modelInstances) {
        // clipFromWorld = projection * view * model
        const pv = new Matrix4();
        pv.elements = clipFromWorld; // projection*view computed in resizeCanvas
        const clip = pv.multiplyMatrix(instance.worldFromPose);
        shaderProgram.setUniformMatrix4fv('clipFromWorld', clip.elements);
        vaoGltf.drawIndexed(gl.TRIANGLES);
    }
    vaoGltf.unbind();
    shaderProgram.unbind();
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    const aspectRatio = canvas.clientWidth / canvas.clientHeight;
    // Use a perspective projection for a good 3D view
    const fovY = 70; // degrees
    const near = 0.1;
    const far = 1000;
    const projection = Matrix4.perspective(fovY, aspectRatio, near, far);
    // Place the camera back along +Z so the world is in front of it
    const cameraZ = 6.0;
    const view = Matrix4.translate(0, 0, -cameraZ);
    clipFromWorld = projection.multiplyMatrix(view).elements;
    render();
}
window.addEventListener('load', () => initialize());
