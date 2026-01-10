import { VertexAttributes } from 'lib/vertex-attributes.js';
import { ShaderProgram } from 'lib/shader-program.js';
import { fetchText } from 'lib/web-utilities.js';
import { VertexArray } from 'lib/vertex-array.js';
import { Matrix4 } from 'lib/matrix.js';
import { Vector3 } from 'lib/vector.js';
import { FirstPersonCamera } from 'lib/camera.js';
import { Prefab } from 'lib/prefab.js';
import { Field2 } from 'lib/field.js';
import { Trimesh } from 'lib/trimesh.js';
import { fetchImage, loadCubemap } from 'lib/web-utilities.js';
import { Gltf } from 'lib/static-gltf.js';
import { FpsCounter } from 'lib/fps-counter.js';
let canvas;
let shaderProgram;
let sunShaderProgram;
let skyboxShaderProgram;
let vaoGltf;
let sunVao;
let towerVao;
let playerLeftVao;
let playerRightVao;
let skyboxVao;
let skyboxTexture = null;
let platforms = [];
let clipFromEyeLeft;
let clipFromEyeRight;
let cameraLeft;
let cameraRight;
let worldFromModel;
let then = null;
let fpsCounter;
let lightPosition = new Vector3(0, 0, 0);
let terrainCenterX;
let terrainCenterZ;
let sunOrbitRadius;
let sunHeight;
let grassTexture = null;
// Camera movement parameters
let moveSpeedLeft = 0.01; // units per millisecond for left camera
const lookSpeedMouse = 0.16; // degrees per millisecond for mouse
const lookSpeedGamepad = 0.24; // degrees per millisecond
const deadzone = 0.15; // Joystick deadzone to prevent drift
const sprintMultiplier = 2.5; // Speed multiplier when sprinting
let pitchDegrees = 75; // Maximum pitch angle in degrees
// Gamepad to camera assignment
let leftCameraGamepadIndex = null;
let rightCameraGamepadIndex = null;
// Key state tracking
const keys = {};
// Helper function to load GLTF and create both rendering VAO and collision mesh
function createGltfObjectWithCollision(gltfMesh, position, rotation, scale) {
    // Extract positions and faces for collision
    const positions = [];
    for (let i = 0; i < gltfMesh.positions.count; i++) {
        const x = gltfMesh.positions.buffer[i * 3];
        const y = gltfMesh.positions.buffer[i * 3 + 1];
        const z = gltfMesh.positions.buffer[i * 3 + 2];
        positions.push(new Vector3(x, y, z));
    }
    const faces = [];
    for (let i = 0; i < gltfMesh.indices.buffer.length; i += 3) {
        faces.push([
            gltfMesh.indices.buffer[i],
            gltfMesh.indices.buffer[i + 1],
            gltfMesh.indices.buffer[i + 2]
        ]);
    }
    // Apply transformations to collision mesh: rotate, then scale, then translate
    const transformedPositions = positions.map(pos => {
        const rotated = rotation.multiplyVector3(pos);
        return new Vector3(rotated.x * scale + position.x, rotated.y * scale + position.y, rotated.z * scale + position.z);
    });
    const collisionMesh = new Trimesh(transformedPositions, faces);
    // Create VAO for rendering (uses the original GLTF data)
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', gltfMesh.positions.count, 3, gltfMesh.positions.buffer);
    attributes.addAttribute('normal', gltfMesh.normals.count, 3, gltfMesh.normals.buffer);
    attributes.addIndices(new Uint32Array(gltfMesh.indices.buffer));
    const vao = new VertexArray(shaderProgram, attributes);
    return { vao, collisionMesh, position, rotation, scale };
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
    // Create skybox shader program
    const skyboxVertexSource = await fetchText('skybox-vertex.glsl');
    const skyboxFragmentSource = await fetchText('skybox-fragment.glsl');
    skyboxShaderProgram = new ShaderProgram(skyboxVertexSource, skyboxFragmentSource);
    // load heightmap
    const heightmapImage = await fetchImage('./images/assets/heightmap.png');
    const heightField = Field2.readFromImage(heightmapImage);
    const factors = new Vector3(3, 100, 3);
    const mesh = heightField.toTrimesh(factors);
    mesh.computeNormals();
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', mesh.vertexCount, 3, mesh.positionBuffer);
    attributes.addAttribute('normal', mesh.vertexCount, 3, mesh.normalBuffer);
    const texBuf = mesh.texCoords;
    if (texBuf) {
        attributes.addAttribute('texPosition', mesh.vertexCount, 2, texBuf);
    }
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
    const towerMesh = await Gltf.readFromUrl('../../models/tower.gltf');
    const towerModelMesh = towerMesh.meshes[0];
    const towerAttributes = new VertexAttributes();
    towerAttributes.addAttribute('position', towerModelMesh.positions.count, 3, towerModelMesh.positions.buffer);
    towerAttributes.addAttribute('normal', towerModelMesh.normals.count, 3, towerModelMesh.normals.buffer);
    towerAttributes.addIndices(new Uint32Array(towerModelMesh.indices.buffer));
    towerVao = new VertexArray(shaderProgram, towerAttributes);
    // Create skybox
    const skyboxMesh = Prefab.skybox();
    const skyboxAttributes = new VertexAttributes();
    skyboxAttributes.addAttribute('position', skyboxMesh.vertexCount, 3, skyboxMesh.positionBuffer);
    skyboxAttributes.addIndices(skyboxMesh.faceBuffer);
    skyboxVao = new VertexArray(skyboxShaderProgram, skyboxAttributes);
    // Load cubemap texture
    skyboxTexture = await loadCubemap('./images/skybox/brown', 'jpg', gl.TEXTURE1);
    // Load platform model from glTF
    const platformModel = await Gltf.readFromUrl('../../models/platform.gltf');
    const platformModelMesh = platformModel.meshes[0];
    // Load player models from glTF
    const playerModel = await Gltf.readFromUrl('../../models/Glock18.gltf');
    const playerModelMesh = playerModel.meshes[0];
    const playerLeftAttributes = new VertexAttributes();
    playerLeftAttributes.addAttribute('position', playerModelMesh.positions.count, 3, playerModelMesh.positions.buffer);
    playerLeftAttributes.addAttribute('normal', playerModelMesh.normals.count, 3, playerModelMesh.normals.buffer);
    playerLeftAttributes.addIndices(new Uint32Array(playerModelMesh.indices.buffer));
    playerLeftVao = new VertexArray(shaderProgram, playerLeftAttributes);
    const playerRightAttributes = new VertexAttributes();
    playerRightAttributes.addAttribute('position', playerModelMesh.positions.count, 3, playerModelMesh.positions.buffer);
    playerRightAttributes.addAttribute('normal', playerModelMesh.normals.count, 3, playerModelMesh.normals.buffer);
    playerRightAttributes.addIndices(new Uint32Array(playerModelMesh.indices.buffer));
    playerRightVao = new VertexArray(shaderProgram, playerRightAttributes);
    // Load grass texture for the terrain
    try {
        const grassImage = await fetchImage('./images/assets/brick.jpg');
        gl.activeTexture(gl.TEXTURE0);
        grassTexture = gl.createTexture();
        if (grassTexture) {
            gl.bindTexture(gl.TEXTURE_2D, grassTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, grassImage);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }
    catch (e) {
        console.warn('Failed to load grass texture:', e);
        grassTexture = null;
    }
    // Set texture uniform once during initialization
    shaderProgram.bind();
    shaderProgram.setUniform1i('grassTexture', 0);
    shaderProgram.unbind();
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
    const cameraHeight = maxHeight * factors.y + 50; // Start just above the terrain
    const cameraPositionLeft = new Vector3(terrainCenterX - cameraDistance, cameraHeight, terrainCenterZ - cameraDistance);
    const cameraPositionRight = new Vector3(terrainCenterX + cameraDistance, cameraHeight, terrainCenterZ + cameraDistance);
    // Calculate look-at point with a consistent slight upward tilt (15 degrees)
    const desiredPitchDegrees = 15;
    const desiredPitchRadians = desiredPitchDegrees * Math.PI / 180;
    // Calculate horizontal distance to terrain center for each camera
    const horizontalDistanceLeft = Math.sqrt(Math.pow(terrainCenterX - cameraPositionLeft.x, 2) +
        Math.pow(terrainCenterZ - cameraPositionLeft.z, 2));
    const horizontalDistanceRight = Math.sqrt(Math.pow(terrainCenterX - cameraPositionRight.x, 2) +
        Math.pow(terrainCenterZ - cameraPositionRight.z, 2));
    // Calculate look-at height using tangent: tan(pitch) = (lookAtHeight - cameraHeight) / horizontalDistance
    const lookAtHeightLeft = cameraPositionLeft.y + horizontalDistanceLeft * Math.tan(desiredPitchRadians);
    const lookAtHeightRight = cameraPositionRight.y + horizontalDistanceRight * Math.tan(desiredPitchRadians);
    const lookAtPointLeft = new Vector3(terrainCenterX, lookAtHeightLeft, terrainCenterZ);
    const lookAtPointRight = new Vector3(terrainCenterX, lookAtHeightRight, terrainCenterZ);
    const offset = 20; // Camera height above terrain
    const worldUp = new Vector3(0, 1, 0);
    cameraLeft = new FirstPersonCamera(cameraPositionLeft, lookAtPointLeft, worldUp, heightField, offset, factors);
    cameraRight = new FirstPersonCamera(cameraPositionRight, lookAtPointRight, worldUp, heightField, offset, factors);
    cameraLeft.acceleration = .05;
    cameraRight.acceleration = .05;
    // ========== CREATE PLATFORMS ==========
    // Platform positions are calculated relative to terrain center and max height
    const platformCenterY = maxHeight * factors.y + 150;
    // Platform 1: Main central platform
    const platform1 = createGltfObjectWithCollision(platformModelMesh, new Vector3(terrainCenterX, platformCenterY, terrainCenterZ), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform1.collisionMesh);
    cameraRight.addMesh(platform1.collisionMesh);
    platforms.push({
        vao: platform1.vao,
        position: platform1.position,
        rotation: platform1.rotation,
        scale: platform1.scale
    });
    // Platform 2: Elevated side platform
    const platform2 = createGltfObjectWithCollision(platformModelMesh, new Vector3(terrainCenterX + 200, platformCenterY + 100, terrainCenterZ + 160), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform2.collisionMesh);
    cameraRight.addMesh(platform2.collisionMesh);
    platforms.push({
        vao: platform2.vao,
        position: platform2.position,
        rotation: platform2.rotation,
        scale: platform2.scale
    });
    // ========== END PLATFORMS ==========
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
        console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", e.gamepad.index, e.gamepad.id, e.gamepad.buttons.length, e.gamepad.axes.length);
        // Assign gamepad to cameras in order of connection
        if (leftCameraGamepadIndex === null) {
            leftCameraGamepadIndex = e.gamepad.index;
            console.log(`Gamepad ${e.gamepad.index} assigned to left camera`);
        }
        else if (rightCameraGamepadIndex === null) {
            rightCameraGamepadIndex = e.gamepad.index;
            console.log(`Gamepad ${e.gamepad.index} assigned to right camera`);
        }
    });
    window.addEventListener("gamepaddisconnected", (e) => {
        console.log("Gamepad disconnected from index %d: %s", e.gamepad.index, e.gamepad.id);
        // Remove gamepad assignment when disconnected
        if (leftCameraGamepadIndex === e.gamepad.index) {
            leftCameraGamepadIndex = null;
            console.log(`Gamepad ${e.gamepad.index} removed from left camera`);
        }
        else if (rightCameraGamepadIndex === e.gamepad.index) {
            rightCameraGamepadIndex = null;
            console.log(`Gamepad ${e.gamepad.index} removed from right camera`);
        }
    });
    // Initialize FPS counter
    fpsCounter = new FpsCounter();
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
function updateCamera(elapsed) {
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
function updateCameraWithKeyboard(camera, elapsed) {
    // Handle shift for sprint on left camera
    const baseSpeed = .2;
    if (keys['shift']) {
        moveSpeedLeft = baseSpeed * sprintMultiplier;
    }
    else {
        moveSpeedLeft = baseSpeed;
    }
    // Calculate input direction from WASD keys
    let inputForward = 0;
    let inputStrafe = 0;
    if (keys['w'])
        inputForward += 1;
    if (keys['s'])
        inputForward -= 1;
    if (keys['a'])
        inputStrafe -= 1;
    if (keys['d'])
        inputStrafe += 1;
    // Update momentum based on input
    camera.updateMomentum(inputForward, inputStrafe);
    // Apply movement with momentum
    camera.applyMomentumMovement(elapsed * moveSpeedLeft);
    currentPitch = Math.asin(camera.forward.y) * 180 / Math.PI;
    if (keys['arrowdown'] && currentPitch > -pitchDegrees)
        camera.pitch(-elapsed * lookSpeedMouse);
    if (keys['arrowup'] && currentPitch < pitchDegrees)
        camera.pitch(elapsed * lookSpeedMouse);
    // Arrow keys for yaw
    if (keys['arrowleft'])
        camera.yaw(elapsed * lookSpeedMouse);
    if (keys['arrowright'])
        camera.yaw(-elapsed * lookSpeedMouse);
    // Space for jump
    if (keys[' '])
        camera.jump(0.88);
}
function updateCameraWithGamepad(camera, gamepad, elapsed, side) {
    // B button (button 1) for sprint
    const isSprinting = gamepad.buttons[1]?.pressed || false;
    const baseSpeed = 0.2;
    const currentSpeed = isSprinting ? baseSpeed * sprintMultiplier : baseSpeed;
    // Update the appropriate side's speed
    if (side === 'left') {
        moveSpeedLeft = currentSpeed;
    }
    else {
    }
    // A button (button 0) for jump
    if (gamepad.buttons[0]?.pressed) {
        camera.jump();
    }
    // Left stick: axes[0] = left/right (strafe), axes[1] = up/down (advance)
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];
    // Right stick: axes[2] = left/right (yaw), axes[3] = up/down (pitch)
    const rightStickX = gamepad.axes[2];
    const rightStickY = gamepad.axes[3];
    // Calculate input with deadzone
    let inputForward = 0;
    let inputStrafe = 0;
    if (Math.abs(leftStickY) > deadzone) {
        inputForward = -leftStickY; // Inverted for forward/back
    }
    if (Math.abs(leftStickX) > deadzone) {
        inputStrafe = leftStickX;
    }
    // Update momentum based on input
    camera.updateMomentum(inputForward, inputStrafe);
    // Apply movement with momentum using the sprint-adjusted speed
    camera.applyMomentumMovement(elapsed * currentSpeed);
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
function animate(now) {
    const elapsed = then ? now - then : 0;
    const lightTime = now / 1000;
    // Update FPS counter
    fpsCounter.update(now);
    // Orbit the sun around the terrain center
    const lightPosX = terrainCenterX + sunOrbitRadius * Math.sin(lightTime);
    const lightPosZ = terrainCenterZ + sunOrbitRadius * Math.cos(lightTime);
    lightPosition = new Vector3(lightPosX, sunHeight, lightPosZ);
    updateCamera(elapsed);
    // Update physics for both cameras (handles jumping)
    cameraLeft.updatePhysics(elapsed);
    cameraRight.updatePhysics(elapsed);
    render();
    requestAnimationFrame(animate);
    then = now;
}
function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.4, 0.3, 0.2, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // Render left half of screen with left camera
    gl.viewport(0, 0, canvas.width / 2, canvas.height);
    renderScene(cameraLeft, clipFromEyeLeft);
    // Render right half of screen with right camera
    gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    renderScene(cameraRight, clipFromEyeRight);
}
function renderScene(camera, clipFromEye) {
    // Render the skybox first with depth writes disabled
    gl.depthMask(false);
    renderSkybox(camera, clipFromEye);
    gl.depthMask(true);
    // Render the terrain
    shaderProgram.bind();
    worldFromModel = Matrix4.identity();
    // Pass the three matrices as separate uniforms
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);
    // Transform light position from world space to eye space
    const lightPositionEye = camera.eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
    //set diffuse to yellow
    shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 0.82);
    shaderProgram.setUniform3f('specularColor', 0, 0, 0);
    shaderProgram.setUniform1f('ambientFactor', 0.3);
    shaderProgram.setUniform1f('shininess', 32.0);
    // Bind grass texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    if (grassTexture) {
        gl.bindTexture(gl.TEXTURE_2D, grassTexture);
    }
    else {
        // If texture is missing, ensure unit 0 is unbound
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    // Enable texture sampling for terrain
    shaderProgram.setUniform1i('playerTexture', 0);
    vaoGltf.bind();
    vaoGltf.drawIndexed(gl.TRIANGLES);
    vaoGltf.unbind();
    shaderProgram.unbind();
    // Render all platforms
    for (const platform of platforms) {
        renderPlatform(camera, clipFromEye, platform);
    }
    // Render towers - you can now create multiple instances with different positions/rotations/scales
    // Example: Add multiple towers at different positions
    renderTower(camera, clipFromEye, new Vector3(terrainCenterX + 800, 20, -40), Matrix4.rotateY(270), 10);
    renderTower(camera, clipFromEye, new Vector3(terrainCenterX - 800, 0, -30), Matrix4.rotateY(12), 8);
    // Render player models
    renderPlayer(cameraLeft, camera, clipFromEye, playerLeftVao, new Vector3(0, 0.5, 1));
    renderPlayer(cameraRight, camera, clipFromEye, playerRightVao, new Vector3(0.5, 1, 0));
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
function renderSkybox(camera, clipFromEye) {
    skyboxShaderProgram.bind();
    // Translate skybox to camera position
    const worldFromModel = Matrix4.translate(camera.from.x, camera.from.y, camera.from.z);
    skyboxShaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    skyboxShaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
    skyboxShaderProgram.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);
    // Bind the cubemap texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, skyboxTexture);
    skyboxShaderProgram.setUniform1i('skybox', 1);
    skyboxVao.bind();
    skyboxVao.drawIndexed(gl.TRIANGLES);
    skyboxVao.unbind();
    skyboxShaderProgram.unbind();
}
function renderPlatform(viewCamera, clipFromEye, platform) {
    shaderProgram.bind();
    // Create transformation using platform's stored properties: translate, rotate, and scale
    const worldFromPlatform = Matrix4.translate(platform.position.x, platform.position.y, platform.position.z).multiplyMatrix(platform.rotation)
        .multiplyMatrix(Matrix4.scale(platform.scale, platform.scale, platform.scale));
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', viewCamera.eyeFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromPlatform.elements);
    // Transform light position from world space to eye space
    const lightPositionEye = viewCamera.eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
    // shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
    shaderProgram.setUniform3f('specularColor', 0, 0, 0);
    shaderProgram.setUniform1f('ambientFactor', 0.3);
    shaderProgram.setUniform1f('shininess', 32.0);
    shaderProgram.setUniform3f('albedo', 0.8, 0.8, 0.8);
    shaderProgram.setUniform1i('playerTexture', 1);
    platform.vao.bind();
    platform.vao.drawIndexed(gl.TRIANGLES);
    platform.vao.unbind();
    shaderProgram.setUniform1i('playerTexture', 0);
    shaderProgram.unbind();
}
function renderPlayer(playerCamera, viewCamera, clipFromEye, playerVao, color) {
    shaderProgram.bind();
    // Position gun in camera-relative space (view space offset)
    const offsetRight = 4; // Offset to the right
    const offsetDown = -7; // Offset down  
    const offsetForward = 7.0; // Offset forward from camera
    const forward = playerCamera.forward;
    const right = playerCamera.right;
    // Calculate camera's actual up vector (perpendicular to forward and right)
    const cameraUp = right.cross(forward).normalize();
    // Build the gun's position by offsetting in camera space
    const modelPosition = new Vector3(playerCamera.from.x + forward.x * offsetForward + right.x * offsetRight + cameraUp.x * offsetDown, playerCamera.from.y + forward.y * offsetForward + right.y * offsetRight + cameraUp.y * offsetDown, playerCamera.from.z + forward.z * offsetForward + right.z * offsetRight + cameraUp.z * offsetDown);
    // Build orientation matrix from camera's basis vectors
    // This creates a rotation matrix that aligns the gun with the camera's orientation
    const orientation = Matrix4.identity();
    orientation.set(0, 0, right.x);
    orientation.set(1, 0, right.y);
    orientation.set(2, 0, right.z);
    orientation.set(0, 1, cameraUp.x);
    orientation.set(1, 1, cameraUp.y);
    orientation.set(2, 1, cameraUp.z);
    orientation.set(0, 2, forward.x);
    orientation.set(1, 2, forward.y);
    orientation.set(2, 2, forward.z);
    // Create transformation: translate to position, apply camera orientation, then adjust for model's default rotation
    const worldFromPlayer = Matrix4.translate(modelPosition.x, modelPosition.y, modelPosition.z).multiplyMatrix(orientation)
        .multiplyMatrix(Matrix4.rotateY(90)) // Rotate 180 degrees more to face forward (was -90, now +90)
        .multiplyMatrix(Matrix4.scale(1, 1, 1));
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', viewCamera.eyeFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromPlayer.elements);
    // Transform light position from world space to eye space
    const lightPositionEye = viewCamera.eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
    // shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 1.0);
    shaderProgram.setUniform3f('specularColor', 0.5, 0.5, 0.5);
    shaderProgram.setUniform1f('ambientFactor', 0.3);
    shaderProgram.setUniform1f('shininess', 50.0);
    shaderProgram.setUniform3f('albedo', color.x, color.y, color.z);
    shaderProgram.setUniform1i('playerTexture', 1);
    playerVao.bind();
    playerVao.drawIndexed(gl.TRIANGLES);
    playerVao.unbind();
    shaderProgram.setUniform1i('playerTexture', 0);
    shaderProgram.unbind();
}
function renderTower(viewCamera, clipFromEye, position, rotation, scale, color = new Vector3(0.6, 0.6, 0.7)) {
    shaderProgram.bind();
    const worldFromTower = Matrix4.translate(position.x, position.y, position.z).multiplyMatrix(rotation)
        .multiplyMatrix(Matrix4.scale(scale, scale, scale));
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', viewCamera.eyeFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromTower.elements);
    const lightPositionEye = viewCamera.eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
    shaderProgram.setUniform3f('specularColor', 0.3, 0.3, 0.3);
    shaderProgram.setUniform1f('ambientFactor', 0.3);
    shaderProgram.setUniform1f('shininess', 32.0);
    shaderProgram.setUniform3f('albedo', color.x, color.y, color.z);
    shaderProgram.setUniform1i('playerTexture', 1);
    towerVao.bind();
    towerVao.drawIndexed(gl.TRIANGLES);
    towerVao.unbind();
    shaderProgram.setUniform1i('playerTexture', 0);
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
