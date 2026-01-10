import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import * as gltf from 'lib/gltf.js';
import { Matrix4 } from 'lib/matrix.js';
let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;

let vao: VertexArray;
let clipFromEye: Matrix4;
let eyeFromWorld: Matrix4;
let rotationX = 0;
let rotationY = 0;
let translateX = 0;
let translateZ = 0;
let then: number | null = null;
let model: gltf.Model;
const gamepads: { [index: number]: Gamepad } = {};

// Model instance management
interface ModelInstance {
  id: number;
  translateX: number;
  translateY: number;
  translateZ: number;
  rotationY: number;
  worldFromPose: Matrix4;
}

let modelInstances: ModelInstance[] = [];
let nextInstanceId = 0;

// Key state tracking
const keys: { [key: string]: boolean } = {};

// Previous gamepad button states for edge detection
const previousButtonStates: { [gamepadIndex: number]: boolean[] } = {};

// Current button states for easy access
const currentButtonStates: { [gamepadIndex: number]: { [buttonIndex: number]: { pressed: boolean, value: number } } } = {};

function gamepadHandler(event: GamepadEvent, connected: boolean) {
  const gamepad = event.gamepad;
  // Note:
  // gamepad === navigator.getGamepads()[gamepad.index]

  if (connected) {
    console.log(
      "Gamepad connected at index %d: %s. %d buttons, %d axes.",
      event.gamepad.index,
      event.gamepad.id,
      event.gamepad.buttons.length,
      event.gamepad.axes.length,
    );
    gamepads[gamepad.index] = gamepad;

    // Initialize button state tracking for this gamepad
    previousButtonStates[gamepad.index] = new Array(gamepad.buttons.length).fill(false);
    currentButtonStates[gamepad.index] = {};

    console.log(gamepads);
  } else {
    console.log(
      "Gamepad disconnected from index %d: %s",
      event.gamepad.index,
      event.gamepad.id,
    );
    delete gamepads[gamepad.index];
    delete previousButtonStates[gamepad.index];
    delete currentButtonStates[gamepad.index];
  }
}


async function initialize() {

  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  await initializeModel('../../models/CharacterLab.gltf');

  // Get the joint count and replace the placeholder in the shader
  const jointCount = model.skinTransforms(0).length;
  const vertexSource = (await fetchText('flat-vertex.glsl')).replace('JOINT_TRANSFORM_COUNT', jointCount.toString());
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  // Recreate VAO with the new shader program
  const attributes = new VertexAttributes();
  attributes.addAttribute('position', model.meshes[0].positions.count, 3, model.meshes[0].positions.buffer);
  attributes.addAttribute('normal', model.meshes[0].normals!.count, 3, model.meshes[0].normals!.buffer);
  attributes.addAttribute('weights', model.meshes[0].weights!.count, 4, model.meshes[0].weights!.buffer);
  attributes.addAttribute('joints', model.meshes[0].joints!.count, 4, new Float32Array(model.meshes[0].joints!.buffer));
  attributes.addIndices(new Uint32Array(model.meshes[0].indices!.buffer));
  vao = new VertexArray(shaderProgram, attributes);

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  window.addEventListener("gamepadconnected", (e) => {
    gamepadHandler(e, true);
  });
  window.addEventListener("gamepaddisconnected", (e) => {
    gamepadHandler(e, false);
  });


  resizeCanvas();
  createModelInstance();
  requestAnimationFrame(animate);
}
async function initializeModel(url: string) {
  // Load a glTF model
  model = await gltf.Model.readFromUrl(url);

  // Print available animation clips
  const animationNames = Object.keys(model.animations);
  for (let clip of animationNames) {
    console.log(`Available animation: ${clip}`);
  }

  if (animationNames.length > 0) {
    console.log(`Starting animation: ${animationNames[0]}`);
    model.play(animationNames[0]);

  }
}

function handleKeyDown(event: KeyboardEvent) {
  keys[event.key.toLowerCase()] = true;

  // B key to create new model instance
  if (event.key.toLowerCase() === 'b') {
    createModelInstance();
  }
}

function handleKeyUp(event: KeyboardEvent) {
  keys[event.key.toLowerCase()] = false;
}

// Update gamepad button states (similar to the updateStatus function)
function updateGamepadStates() {
  for (const gamepad of navigator.getGamepads()) {
    if (!gamepad) continue;

    // Initialize if not exists
    if (!currentButtonStates[gamepad.index]) {
      currentButtonStates[gamepad.index] = {};
    }

    // Update button states
    for (const [i, button] of gamepad.buttons.entries()) {
      const wasPressed = previousButtonStates[gamepad.index][i];
      const isPressed = button.pressed;
      const previousValue = currentButtonStates[gamepad.index][i]?.value || 0;

      // Store current state
      currentButtonStates[gamepad.index][i] = {
        pressed: isPressed,
        value: button.value
      };

      // Special handling for buttons 6 and 7 (analog triggers) - show dynamic value updates
      if (i === 6 || i === 7) {
        const currentValue = button.value;
        const previousPct = previousValue;

        // Log value changes for analog triggers (even if not "pressed")
        if (currentValue !== previousPct) {
          const triggerName = i === 6 ? "Left Trigger" : "Right Trigger";
          if (currentValue > 0) {
            console.log(`${triggerName} (Button ${i}) Value: ${currentValue}`);
          } else if (previousPct > 0) {
            console.log(`${triggerName} (Button ${i}): Released`);
          }
        }
      } else {
        // Regular button press/release logging for other buttons
        if (isPressed && !wasPressed) {
          console.log(`Button ${i} [PRESSED]`);
          if (i === 1) { // B button
            createModelInstance();
          }
        } else if (!isPressed && wasPressed) {
          console.log(`Button ${i} [RELEASED]`);
        }
      }

      // Update previous state
      previousButtonStates[gamepad.index][i] = isPressed;
    }
  }
}

// Helper function to check if a specific button is currently held
function isButtonHeld(gamepadIndex: number, buttonIndex: number): boolean {
  return currentButtonStates[gamepadIndex]?.[buttonIndex]?.pressed || false;
}

// Helper function to get button value (for analog buttons)
function getButtonValue(gamepadIndex: number, buttonIndex: number): number {
  return currentButtonStates[gamepadIndex]?.[buttonIndex]?.value || 0;
}

// Function to create a new model instance
function createModelInstance(): void {
  const newInstance: ModelInstance = {
    id: nextInstanceId++,
    translateX: 0,
    translateY: -0.5,
    translateZ: 0,
    rotationY: 0,
    worldFromPose: Matrix4.identity()
  };

  modelInstances.push(newInstance);
  console.log(`Created model instance ${newInstance.id}. Total instances: ${modelInstances.length}`);
}

// Function to get the most recently added model instance
function getMostRecentInstance(): ModelInstance | null {
  return modelInstances.length > 0 ? modelInstances[modelInstances.length - 1] : null;
}

function updateRotation(elapsed: number) {
  let rotationSpeed = 0.002;
  let translateSpeed = 0.01;

  // Update gamepad button states first
  updateGamepadStates();

  // Gamepad controls - check all connected gamepads
  let gamepadInput = false;
  const gamepads = navigator.getGamepads();

  for (const gamepad of gamepads) {
    if (gamepad) {
      // Check analog trigger values (buttons 6 and 7)
      const leftTriggerValue = getButtonValue(gamepad.index, 6);
      const rightTriggerValue = getButtonValue(gamepad.index, 7);

      // Use left trigger for something (e.g., slow movement)
      if (leftTriggerValue > 0) {
        console.log('holding left trigger');
      }

      // Use right trigger for something (e.g., boost/turbo)
      if (rightTriggerValue > 0) {
        console.log('holding right trigger');
      }
      if (isButtonHeld(gamepad.index, 0)) {
        console.log('holding A button');
        if (translateSpeed !== .02) {
          translateSpeed = .02;
        }
      }
      else {
        translateSpeed = 0.01; // Reset to normal speed when A is not held
      }

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
          gamepadInput = true;
        }
        if (Math.abs(leftStickY) > deadzone) {
          recentInstance.translateZ += leftStickY * elapsed * translateSpeed * 2; // Forward/back translation in XZ plane
          gamepadInput = true;
        }
        if (Math.abs(rightStickX) > deadzone) {
          recentInstance.rotationY += rightStickX * elapsed * rotationSpeed * 2; // Rotation about Y-axis
          gamepadInput = true;
        }
        if (Math.abs(rightStickY) > deadzone) {
          recentInstance.translateY -= rightStickY * elapsed * translateSpeed * 2; // Y-axis translation (up/down)
          gamepadInput = true;
        }

        // Update the world transformation matrix for this instance
        recentInstance.worldFromPose = Matrix4.translate(recentInstance.translateX, recentInstance.translateY, recentInstance.translateZ)
          .multiplyMatrix(Matrix4.rotateY(recentInstance.rotationY * 180.0 / Math.PI));
      } else {
        // If no instances exist, control the original model (fallback behavior)
        if (Math.abs(leftStickX) > deadzone) {
          translateX += leftStickX * translateSpeed * elapsed; // Left/right translation
          gamepadInput = true;
        }
        if (Math.abs(leftStickY) > deadzone) {
          translateZ += leftStickY * elapsed * translateSpeed * 2; // Up/down translation
          gamepadInput = true;
        }
        if (Math.abs(rightStickX) > deadzone) {
          rotationY += rightStickX * elapsed * rotationSpeed * 2; // Left/right rotation
          gamepadInput = true;
        }
        if (Math.abs(rightStickY) > deadzone) {
          rotationX += rightStickY * elapsed * rotationSpeed * 2; // Up/down rotation
          gamepadInput = true;
        }
      }
      break;
    }
  }

  // WASD controls (only if no gamepad input to avoid conflicts)
  if (!gamepadInput) {
    const recentInstance = getMostRecentInstance();

    if (recentInstance) {
      // Control the most recent instance with keyboard
      if (keys['w']) recentInstance.translateZ -= elapsed * translateSpeed; // Forward
      if (keys['s']) recentInstance.translateZ += elapsed * translateSpeed; // Backward
      if (keys['a']) recentInstance.translateX -= elapsed * translateSpeed; // Left
      if (keys['d']) recentInstance.translateX += elapsed * translateSpeed; // Right
      if (keys['q']) recentInstance.rotationY -= elapsed * rotationSpeed; // Rotate left
      if (keys['e']) recentInstance.rotationY += elapsed * rotationSpeed; // Rotate right
      if (keys['r']) recentInstance.translateY += elapsed * translateSpeed; // Up
      if (keys['f']) recentInstance.translateY -= elapsed * translateSpeed; // Down

      // Update the world transformation matrix for this instance
      recentInstance.worldFromPose = Matrix4.translate(recentInstance.translateX, recentInstance.translateY, recentInstance.translateZ)
        .multiplyMatrix(Matrix4.rotateY(recentInstance.rotationY * 180.0 / Math.PI));
    } else {
      // If no instances exist, control the original model (fallback behavior)
      if (keys['w']) rotationX -= elapsed * rotationSpeed; // Rotate up
      if (keys['s']) rotationX += elapsed * rotationSpeed; // Rotate down
      if (keys['a']) rotationY -= elapsed * rotationSpeed; // Rotate left
      if (keys['d']) rotationY += elapsed * rotationSpeed; // Rotate right
    }
  }
}


function animate(now: DOMHighResTimeStamp) {
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
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  shaderProgram.bind();

  // Upload camera matrices (these are the same for all instances)
  shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
  shaderProgram.setUniformMatrix4fv('eyeFromWorld', eyeFromWorld.elements);

  // Upload bone matrices (these are the same for all instances since they share the same animation)
  for (let [i, matrix] of model.skinTransforms(300).entries()) {
    shaderProgram.setUniformMatrix4fv(`jointTransforms[${i}]`, matrix.elements);
  }

  vao.bind();

  // Render all model instances
  for (const instance of modelInstances) {
    shaderProgram.setUniformMatrix4fv('worldFromPose', instance.worldFromPose.elements);
    vao.drawIndexed(gl.TRIANGLES);
  }

  vao.unbind();
  shaderProgram.unbind();
}

function updateProjection() {
  const aspect = canvas.clientWidth / canvas.clientHeight;
  const fovY = 50;
  const near = 0.1;
  const far = 1000;
  const cameraZ = 8.0;
  clipFromEye = Matrix4.perspective(fovY, aspect, near, far);
  eyeFromWorld = Matrix4.translate(0, 0, -cameraZ);
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  updateProjection();

  render();
}

window.addEventListener('load', () => initialize());