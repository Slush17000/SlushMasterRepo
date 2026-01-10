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
import { Gltf } from 'lib/static-gltf.js';

let canvas: HTMLCanvasElement;
let shaderProgram: ShaderProgram;
let sunShaderProgram: ShaderProgram;

let vaoGltf: VertexArray;
let sunVao: VertexArray;
let playerLeftVao: VertexArray;
let playerRightVao: VertexArray;
let clipFromEyeLeft: Matrix4;
let clipFromEyeRight: Matrix4;
let cameraLeft: TerrainCamera;
let cameraRight: TerrainCamera;
let worldFromModel: Matrix4;
let then: number | null = null;

let lightPosition = new Vector3(0, 0, 0);
let terrainCenterX: number;
let terrainCenterZ: number;
let sunOrbitRadius: number;
let sunHeight: number;

// Camera movement parameters
let moveSpeedLeft = 0.05; // units per millisecond for left camera
const lookSpeedMouse = 0.16; // degrees per millisecond for mouse
const lookSpeedGamepad = 0.24; // degrees per millisecond
const deadzone = 0.15; // Joystick deadzone to prevent drift
const sprintMultiplier = 5.0; // Speed multiplier when sprinting
let pitchDegrees = 50; // Maximum pitch angle in degrees

// Gamepad to camera assignment
let leftCameraGamepadIndex: number | null = null;
let rightCameraGamepadIndex: number | null = null;

// Key state tracking
const keys: { [key: string]: boolean } = {};

async function initialize() {

  canvas = document.getElementById('canvas') as HTMLCanvasElement;
  window.gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  const vertexSource = await fetchText('flat-vertex.glsl');
  const fragmentSource = await fetchText('flat-fragment.glsl');
  shaderProgram = new ShaderProgram(vertexSource, fragmentSource);

  // Create sun shader program
  const sunVertexSource = await fetchText('sun-vertex.glsl');
  const sunFragmentSource = await fetchText('sun-fragment.glsl');
  sunShaderProgram = new ShaderProgram(sunVertexSource, sunFragmentSource);

  // load heightmap
  const heightmapImage = await fetchImage('heightmap.png');
  const heightField = Field2.readFromImage(heightmapImage);
  const factors = new Vector3(3, 500, 3);
  const mesh = heightField.toTrimesh(factors);

  mesh.computeNormals();
  const attributes = new VertexAttributes();
  attributes.addAttribute('position', mesh.vertexCount, 3, mesh.positionBuffer);
  attributes.addAttribute('normal', mesh.vertexCount, 3, mesh.normalBuffer);
  attributes.addIndices(mesh.faceBuffer);
  vaoGltf = new VertexArray(shaderProgram, attributes);

  // Create sun sphere
  const sphereMesh = Prefab.sphere(10, 6, 6);
  sphereMesh.computeNormals();

  const sunAttributes = new VertexAttributes();
  sunAttributes.addAttribute('position', sphereMesh.vertexCount, 3, sphereMesh.positionBuffer);
  sunAttributes.addAttribute('normal', sphereMesh.vertexCount, 3, sphereMesh.normalBuffer);
  sunAttributes.addIndices(sphereMesh.faceBuffer);
  sunVao = new VertexArray(sunShaderProgram, sunAttributes);

  // Load player models from glTF
  const playerModel = await Gltf.readFromUrl('../../models/bumpy.gltf');
  const playerModelMesh = playerModel.meshes[0];

  const playerLeftAttributes = new VertexAttributes();
  playerLeftAttributes.addAttribute('position', playerModelMesh.positions.count, 3, playerModelMesh.positions.buffer);
  playerLeftAttributes.addAttribute('normal', playerModelMesh.normals!.count, 3, playerModelMesh.normals!.buffer);
  playerLeftAttributes.addIndices(new Uint32Array(playerModelMesh.indices!.buffer));
  playerLeftVao = new VertexArray(shaderProgram, playerLeftAttributes);

  const playerRightAttributes = new VertexAttributes();
  playerRightAttributes.addAttribute('position', playerModelMesh.positions.count, 3, playerModelMesh.positions.buffer);
  playerRightAttributes.addAttribute('normal', playerModelMesh.normals!.count, 3, playerModelMesh.normals!.buffer);
  playerRightAttributes.addIndices(new Uint32Array(playerModelMesh.indices!.buffer));
  playerRightVao = new VertexArray(shaderProgram, playerRightAttributes);

  // Calculate terrain center based on heightmap dimensions and factors
  terrainCenterX = (heightField.width - 1) / 2 * factors.x;
  terrainCenterZ = (heightField.height - 1) / 2 * factors.z;

  // Find the maximum height value in the heightfield
  let maxHeight = 0;
  for (let i = 0; i < heightField.values.length; i++) {
    if (heightField.values[i] > maxHeight) {
      maxHeight = heightField.values[i];
    }
  }

  // Sun orbit parameters proportional to terrain size
  sunOrbitRadius = Math.max(heightField.width, heightField.height) * factors.x * 0.15;
  sunHeight = maxHeight * factors.y + 200; // 200 units above the highest terrain point

  // Position cameras on opposite sides of the terrain, proportional to terrain size
  const cameraDistance = Math.max(heightField.width, heightField.height) * factors.x * 0.3;
  const cameraHeight = Math.max(heightField.width, heightField.height) * factors.y * 0.5;

  const cameraPositionLeft = new Vector3(
    terrainCenterX - cameraDistance,
    cameraHeight,
    terrainCenterZ - cameraDistance
  );
  const cameraPositionRight = new Vector3(
    terrainCenterX + cameraDistance,
    cameraHeight,
    terrainCenterZ + cameraDistance
  );

  // Calculate look-at point with a consistent slight upward tilt (15 degrees)
  const desiredPitchDegrees = 15;
  const desiredPitchRadians = desiredPitchDegrees * Math.PI / 180;

  // Calculate horizontal distance to terrain center for each camera
  const horizontalDistanceLeft = Math.sqrt(
    Math.pow(terrainCenterX - cameraPositionLeft.x, 2) +
    Math.pow(terrainCenterZ - cameraPositionLeft.z, 2)
  );
  const horizontalDistanceRight = Math.sqrt(
    Math.pow(terrainCenterX - cameraPositionRight.x, 2) +
    Math.pow(terrainCenterZ - cameraPositionRight.z, 2)
  );

  // Calculate look-at height using tangent: tan(pitch) = (lookAtHeight - cameraHeight) / horizontalDistance
  const lookAtHeightLeft = cameraPositionLeft.y + horizontalDistanceLeft * Math.tan(desiredPitchRadians);
  const lookAtHeightRight = cameraPositionRight.y + horizontalDistanceRight * Math.tan(desiredPitchRadians);

  const lookAtPointLeft = new Vector3(terrainCenterX, lookAtHeightLeft, terrainCenterZ);
  const lookAtPointRight = new Vector3(terrainCenterX, lookAtHeightRight, terrainCenterZ);

  const offset = 20; // Camera height above terrain

  cameraLeft = new TerrainCamera(cameraPositionLeft, lookAtPointLeft, heightField, offset, factors);
  cameraRight = new TerrainCamera(cameraPositionRight, lookAtPointRight, heightField, offset, factors);

  // Event listeners
  window.addEventListener('resize', () => resizeCanvas());
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('pointerdown', () => {
    document.body.requestPointerLock();
  });

  window.addEventListener('pointermove', event => {
    if (document.pointerLockElement) {
      const currentPitch = Math.asin(cameraLeft.forward.y) * 180 / Math.PI;
      const pitchDelta = -event.movementY * lookSpeedMouse / 2.3;
      if ((pitchDelta > 0 && currentPitch < pitchDegrees) || (pitchDelta < 0 && currentPitch > -pitchDegrees)) {
        cameraLeft.pitch(pitchDelta);
      }
      cameraLeft.yaw(-event.movementX * lookSpeedMouse / 2.3);
      render();
    }
  });
  // Gamepad event listeners
  window.addEventListener("gamepadconnected", (e) => {
    console.log(
      "Gamepad connected at index %d: %s. %d buttons, %d axes.",
      e.gamepad.index,
      e.gamepad.id,
      e.gamepad.buttons.length,
      e.gamepad.axes.length,
    );
    
    // Assign gamepad to cameras in order of connection
    if (leftCameraGamepadIndex === null) {
      leftCameraGamepadIndex = e.gamepad.index;
      console.log(`Gamepad ${e.gamepad.index} assigned to left camera`);
    } else if (rightCameraGamepadIndex === null) {
      rightCameraGamepadIndex = e.gamepad.index;
      console.log(`Gamepad ${e.gamepad.index} assigned to right camera`);
    }
  });
  
  window.addEventListener("gamepaddisconnected", (e) => {
    console.log(
      "Gamepad disconnected from index %d: %s",
      e.gamepad.index,
      e.gamepad.id,
    );
    
    // Remove gamepad assignment when disconnected
    if (leftCameraGamepadIndex === e.gamepad.index) {
      leftCameraGamepadIndex = null;
      console.log(`Gamepad ${e.gamepad.index} removed from left camera`);
    } else if (rightCameraGamepadIndex === e.gamepad.index) {
      rightCameraGamepadIndex = null;
      console.log(`Gamepad ${e.gamepad.index} removed from right camera`);
    }
  });


  resizeCanvas();
  // start the animation loop
  requestAnimationFrame(animate);

}

function handleKeyDown(event: KeyboardEvent) {
  keys[event.key.toLowerCase()] = true;
}

function handleKeyUp(event: KeyboardEvent) {
  keys[event.key.toLowerCase()] = false;
}

let currentPitch = 0;
function updateCamera(elapsed: number) {
  const gamepads = navigator.getGamepads();
  
  // Get the gamepads assigned to each camera
  const leftGamepad = leftCameraGamepadIndex !== null ? gamepads[leftCameraGamepadIndex] : null;
  const rightGamepad = rightCameraGamepadIndex !== null ? gamepads[rightCameraGamepadIndex] : null;

  // Update left camera - always allow keyboard/mouse, plus gamepad if assigned
  updateCameraWithKeyboard(cameraLeft, elapsed);
  if (leftGamepad) {
    updateCameraWithGamepad(cameraLeft, leftGamepad, elapsed, 'left');
  }

  // Update right camera
  if (rightGamepad) {
    // Right camera controlled by assigned gamepad
    updateCameraWithGamepad(cameraRight, rightGamepad, elapsed, 'right');
  }
  // If no gamepad assigned to right camera, it doesn't move
}

function updateCameraWithKeyboard(camera: TerrainCamera, elapsed: number) {
  // Handle shift for sprint on left camera
  if (keys['shift']) {
    moveSpeedLeft = 0.05 * sprintMultiplier;
  } else {
    moveSpeedLeft = 0.05;
  }

  // Keyboard controls - WASD for movement
  if (keys['w']) camera.advance(elapsed * moveSpeedLeft);
  if (keys['s']) camera.advance(-elapsed * moveSpeedLeft);
  if (keys['a']) camera.strafe(-elapsed * moveSpeedLeft);
  if (keys['d']) camera.strafe(elapsed * moveSpeedLeft);

  currentPitch = Math.asin(camera.forward.y) * 180 / Math.PI;
  if (keys['arrowdown'] && currentPitch > -pitchDegrees) camera.pitch(-elapsed * lookSpeedMouse);
  if (keys['arrowup'] && currentPitch < pitchDegrees) camera.pitch(elapsed * lookSpeedMouse);

  // Arrow keys for yaw
  if (keys['arrowleft']) camera.yaw(elapsed * lookSpeedMouse);
  if (keys['arrowright']) camera.yaw(-elapsed * lookSpeedMouse);
}

function updateCameraWithGamepad(camera: TerrainCamera, gamepad: Gamepad, elapsed: number, side: 'left' | 'right') {
  // B button (button 1) for sprint
  const isSprinting = gamepad.buttons[1]?.pressed || false;
  const baseSpeed = 0.05;
  const currentSpeed = isSprinting ? baseSpeed * sprintMultiplier : baseSpeed;

  // Update the appropriate side's speed
  if (side === 'left') {
    moveSpeedLeft = currentSpeed;
  } else {
  }

  // Left stick: axes[0] = left/right (strafe), axes[1] = up/down (advance)
  const leftStickX = gamepad.axes[0];
  const leftStickY = gamepad.axes[1];

  // Right stick: axes[2] = left/right (yaw), axes[3] = up/down (pitch)
  const rightStickX = gamepad.axes[2];
  const rightStickY = gamepad.axes[3];

  // Apply movement with deadzone
  if (Math.abs(leftStickX) > deadzone) {
    camera.strafe(leftStickX * elapsed * currentSpeed);
  }
  if (Math.abs(leftStickY) > deadzone) {
    camera.advance(-leftStickY * elapsed * currentSpeed); // Inverted for forward/back
  }

  // Apply look with deadzone
  if (Math.abs(rightStickX) > deadzone) {
    camera.yaw(-rightStickX * elapsed * lookSpeedGamepad);
  }
  if (Math.abs(rightStickY) > deadzone) {
    const currentPitch = Math.asin(camera.forward.y) * 180 / Math.PI;
    const pitchDelta = -rightStickY * elapsed * lookSpeedGamepad;
    if ((pitchDelta > 0 && currentPitch < pitchDegrees) || (pitchDelta < 0 && currentPitch > -pitchDegrees)) {
      camera.pitch(pitchDelta);
    }
  }
}


function animate(now: DOMHighResTimeStamp) {
  const elapsed = then ? now - then : 0;
  const lightTime = now / 1000;

  // Orbit the sun around the terrain center
  const lightPosX = terrainCenterX + sunOrbitRadius * Math.sin(lightTime);
  const lightPosZ = terrainCenterZ + sunOrbitRadius * Math.cos(lightTime);
  lightPosition = new Vector3(lightPosX, sunHeight, lightPosZ);

  updateCamera(elapsed);
  render();
  requestAnimationFrame(animate);
  then = now;
}

function render() {
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.SCISSOR_TEST);
  gl.clearColor(0.4, 0.3, 0.2, 1.0);

  // Render left half of screen with left camera
  gl.viewport(0, 0, canvas.width / 2, canvas.height);
  gl.scissor(0, 0, canvas.width / 2, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  renderScene(cameraLeft, clipFromEyeLeft, 'left');

  // Render right half of screen with right camera
  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.scissor(canvas.width / 2, 0, canvas.width / 2, canvas.height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  renderScene(cameraRight, clipFromEyeRight, 'right');
  
  gl.disable(gl.SCISSOR_TEST);
}

function renderScene(camera: TerrainCamera, clipFromEye: Matrix4, side: 'left' | 'right') {
  // Render the terrain first
  shaderProgram.bind();
  worldFromModel = Matrix4.identity();

  // Pass the three matrices as separate uniforms
  shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
  shaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
  shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);

  // Transform light position from world space to eye space
  const lightPositionEye = camera.eyeFromWorld.multiplyPosition(lightPosition);
  shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);

  shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
  shaderProgram.setUniform3f('specularColor', 0, 0, 0);
  shaderProgram.setUniform1f('ambientFactor', 0.1);
  shaderProgram.setUniform1f('shininess', 1000.0);
  shaderProgram.setUniform3f('albedo', 1, .35, .35);

  vaoGltf.bind();
  vaoGltf.drawIndexed(gl.TRIANGLES);
  vaoGltf.unbind();
  shaderProgram.unbind();

  // Render player models - each camera sees the OTHER player
  if (side === 'left') {
    // Left camera sees the right player (green)
    renderPlayer(cameraRight, camera, clipFromEye, playerRightVao, new Vector3(0.5, 1, 0));
  } else {
    // Right camera sees the left player (blue)
    renderPlayer(cameraLeft, camera, clipFromEye, playerLeftVao, new Vector3(0, 0.5, 1));
  }

  // Render the sun after terrain
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
}

function renderPlayer(
  playerCamera: TerrainCamera,
  viewCamera: TerrainCamera,
  clipFromEye: Matrix4,
  playerVao: VertexArray,
  color: Vector3
) {
  shaderProgram.bind();

  // Calculate the yaw angle from the camera's forward vector
  // The forward vector is the direction the camera is looking
  const forward = playerCamera.forward;
  const yawRadians = Math.atan2(forward.x, forward.z);
  const yawDegrees = yawRadians * 180 / Math.PI;

  // Position the model in front of the camera using the camera's forward vector
  // This ensures the model faces the same direction as the camera
  const modelDistance = 0; // Distance in front of the camera
  const modelPosition = new Vector3(
    playerCamera.from.x + forward.x * modelDistance,
    playerCamera.from.y + 1,
    playerCamera.from.z + forward.z * modelDistance
  );

  // Create transformation: translate, rotate around Y-axis, then scale
  // Adding -90 to yawDegrees to account for glTF model default orientation
  const worldFromPlayer = Matrix4.translate(
    modelPosition.x,
    modelPosition.y,
    modelPosition.z
  ).multiplyMatrix(Matrix4.rotateY(yawDegrees))
    .multiplyMatrix(Matrix4.scale(3,3,3)); // Scale up the model

  shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
  shaderProgram.setUniformMatrix4fv('eyeFromWorld', viewCamera.eyeFromWorld.elements);
  shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromPlayer.elements);

  // Transform light position from world space to eye space
  const lightPositionEye = viewCamera.eyeFromWorld.multiplyPosition(lightPosition);
  shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);

  shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
  shaderProgram.setUniform3f('specularColor', 0.5, 0.5, 0.5);
  shaderProgram.setUniform1f('ambientFactor', 0.3);
  shaderProgram.setUniform1f('shininess', 50.0);
  shaderProgram.setUniform3f('albedo', color.x, color.y, color.z);

  playerVao.bind();
  playerVao.drawIndexed(gl.TRIANGLES);
  playerVao.unbind();
  shaderProgram.unbind();
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Each half gets its own aspect ratio
  const halfWidth = canvas.clientWidth / 2;
  const aspectRatio = halfWidth / canvas.clientHeight;

  const fovY = 75;
  const near = .1;
  const far = 10000;

  clipFromEyeLeft = Matrix4.perspective(fovY, aspectRatio, near, far);
  clipFromEyeRight = Matrix4.perspective(fovY, aspectRatio, near, far);

  render();
}

window.addEventListener('load', () => initialize());
