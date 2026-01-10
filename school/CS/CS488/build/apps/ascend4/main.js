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
import * as gltf from 'lib/gltf.js';
// ===== ANIMATION SYSTEM =====
var AnimationState;
(function (AnimationState) {
    AnimationState["IDLE"] = "idle";
    AnimationState["WALK"] = "walk";
    AnimationState["JUMP_UP"] = "jump_up";
    AnimationState["JUMP_DOWN"] = "jump_down";
    AnimationState["RIGHT_PUNCH"] = "right_punch";
    AnimationState["RIGHT_KICK"] = "right_kick";
    AnimationState["LEFT_PUNCH"] = "left_punch";
    AnimationState["LEFT_KICK"] = "left_kick";
    AnimationState["WILKY"] = "wilky";
    AnimationState["FRAT_FLICK"] = "frat_flick";
    AnimationState["CAM_WARD"] = "cam_ward";
    AnimationState["WAVE_1"] = "wave_1";
    AnimationState["WAVE_2"] = "wave_2";
})(AnimationState || (AnimationState = {}));
class AnimationController {
    constructor(model) {
        this.model = model;
        this.currentAnimation = AnimationState.IDLE;
        this.currentAnimationTime = 0;
        this.isAnimationComplete = false;
        this.animationConfigs = new Map();
        this.previousVerticalVelocity = 0;
        this.wasJumping = false;
        // Configure animations - durations will be determined from the model
        this.setupAnimationConfigs();
        this.extractAnimationDurations();
    }
    extractAnimationDurations() {
        // Extract actual durations from the model's animation data
        for (const [animName, channels] of Object.entries(this.model.animations)) {
            let maxDuration = 0;
            // Iterate through all channels and transforms to find the longest keyframe time
            for (const channel of Object.values(channels)) {
                for (const transformType of ['translation', 'rotation', 'scale']) {
                    const keyframes = channel[transformType];
                    if (keyframes && keyframes.length > 0) {
                        const lastKeyframe = keyframes[keyframes.length - 1];
                        if (lastKeyframe.time > maxDuration) {
                            maxDuration = lastKeyframe.time;
                        }
                    }
                }
            }
            // Convert to milliseconds and update config if animation exists
            if (maxDuration > 0) {
                const durationMs = maxDuration * 1000;
                // Find the matching animation state and update its duration
                for (const [state, config] of this.animationConfigs.entries()) {
                    if (config.name === animName) {
                        config.duration = durationMs;
                        console.log(`Animation '${animName}' duration: ${durationMs}ms`);
                        break;
                    }
                }
            }
        }
    }
    setupAnimationConfigs() {
        // Interruptible animations
        this.animationConfigs.set(AnimationState.IDLE, {
            name: 'idle',
            isInterruptible: true,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: false
        });
        this.animationConfigs.set(AnimationState.WALK, {
            name: 'walk',
            isInterruptible: true,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: false
        });
        this.animationConfigs.set(AnimationState.JUMP_UP, {
            name: 'jump_up',
            isInterruptible: true,
            duration: 0,
            speedMultiplier: 2, // Slow down to prevent early reset before apex
            returnToIdle: true // Return to idle when complete
        });
        this.animationConfigs.set(AnimationState.JUMP_DOWN, {
            name: 'jump_down',
            isInterruptible: true,
            duration: 0,
            speedMultiplier: 2,
            returnToIdle: true // Return to idle when complete
        });
        // Non-interruptible animations (return to idle after completion)
        this.animationConfigs.set(AnimationState.RIGHT_PUNCH, {
            name: 'right_punch',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.RIGHT_KICK, {
            name: 'right_kick',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.LEFT_PUNCH, {
            name: 'left_punch',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.LEFT_KICK, {
            name: 'left_kick',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.WILKY, {
            name: 'wilky',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.FRAT_FLICK, {
            name: 'frat_flick',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.CAM_WARD, {
            name: 'cam_ward',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.WAVE_1, {
            name: 'wave_1',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
        this.animationConfigs.set(AnimationState.WAVE_2, {
            name: 'wave_2',
            isInterruptible: false,
            duration: 0,
            speedMultiplier: 1.0,
            returnToIdle: true
        });
    }
    requestAnimation(state) {
        // Check if current animation can be interrupted
        const currentConfig = this.animationConfigs.get(this.currentAnimation);
        if (!currentConfig)
            return false;
        // Don't allow interruption of non-interruptible animations
        if (!currentConfig.isInterruptible && !this.isAnimationComplete) {
            return false;
        }
        // Don't play the same animation if it's already playing
        if (this.currentAnimation === state && !this.isAnimationComplete) {
            return false;
        }
        // Switch to the new animation
        this.playAnimation(state);
        return true;
    }
    playAnimation(state) {
        const config = this.animationConfigs.get(state);
        if (!config)
            return;
        this.currentAnimation = state;
        this.currentAnimationTime = 0;
        this.isAnimationComplete = false;
        // Play the animation on the model
        this.model.play(config.name);
    }
    update(elapsed) {
        const config = this.animationConfigs.get(this.currentAnimation);
        if (!config)
            return;
        // Update animation time with speed multiplier
        const adjustedElapsed = elapsed * config.speedMultiplier;
        this.currentAnimationTime += adjustedElapsed;
        // Check if animation is complete (based on duration)
        if (config.duration > 0 && this.currentAnimationTime >= config.duration) {
            // Mark as complete
            if (!this.isAnimationComplete) {
                this.isAnimationComplete = true;
                // Return to idle if configured
                if (config.returnToIdle) {
                    this.playAnimation(AnimationState.IDLE);
                }
            }
        }
    }
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    isAttacking() {
        // Check if current animation is an attack animation and not complete
        const isAttackAnimation = (this.currentAnimation === AnimationState.RIGHT_PUNCH ||
            this.currentAnimation === AnimationState.LEFT_PUNCH ||
            this.currentAnimation === AnimationState.RIGHT_KICK ||
            this.currentAnimation === AnimationState.LEFT_KICK);
        if (!isAttackAnimation || this.isAnimationComplete) {
            return false;
        }
        // Only register hit during the middle portion of the animation (30%-70%)
        const config = this.animationConfigs.get(this.currentAnimation);
        if (!config || config.duration === 0) {
            return false;
        }
        const progress = this.currentAnimationTime / config.duration;
        return progress >= 0.3 && progress <= 0.7;
    }
    setAnimationSpeed(state, multiplier) {
        const config = this.animationConfigs.get(state);
        if (config) {
            config.speedMultiplier = multiplier;
        }
    }
    updateJumpAnimation(camera) {
        // Handle jump animations based on camera state
        if (camera.isJumping) {
            // Just started jumping
            if (!this.wasJumping) {
                this.requestAnimation(AnimationState.JUMP_UP);
                this.wasJumping = true;
            }
            // Reached apex of jump (velocity changed from positive to negative)
            else if (this.previousVerticalVelocity > 0 && camera.verticalVelocity <= 0) {
                this.requestAnimation(AnimationState.JUMP_DOWN);
            }
            this.previousVerticalVelocity = camera.verticalVelocity;
        }
        else {
            // Just landed - force return to idle
            if (this.wasJumping) {
                this.wasJumping = false;
                this.previousVerticalVelocity = 0;
                // Force idle animation on landing
                this.playAnimation(AnimationState.IDLE);
            }
        }
    }
}
// ===== END ANIMATION SYSTEM =====
let modelLeft; // Separate model instance for left player
let modelRight; // Separate model instance for right player
let canvas;
let compassLeftDiv;
let compassRightDiv;
let altimeterLeftDiv;
let altimeterRightDiv;
let healthBarLeftDiv;
let healthBarRightDiv;
// Game state management
var GameState;
(function (GameState) {
    GameState[GameState["WAITING_FOR_START"] = 0] = "WAITING_FOR_START";
    GameState[GameState["COUNTDOWN"] = 1] = "COUNTDOWN";
    GameState[GameState["PLAYING"] = 2] = "PLAYING";
})(GameState || (GameState = {}));
// Color palette for player selection
const PLAYER_COLORS = [
    { name: 'Red', rgb: new Vector3(1.0, 0.0, 0.0) },
    { name: 'Orange', rgb: new Vector3(1.0, 0.5, 0.0) },
    { name: 'Yellow', rgb: new Vector3(1.0, 1.0, 0.0) },
    { name: 'Green', rgb: new Vector3(0.0, 0.8, 0.0) },
    { name: 'Light Blue', rgb: new Vector3(0.3, 0.7, 1.0) },
    { name: 'Dark Blue', rgb: new Vector3(0.0, 0.0, 1.0) },
    { name: 'Purple', rgb: new Vector3(0.6, 0.0, 0.8) }
];
let gameState = GameState.WAITING_FOR_START;
let leftPlayerReady = false;
let rightPlayerReady = false;
// Color selection
let leftPlayerColorIndex = 5; // Default to Dark Blue
let rightPlayerColorIndex = 3; // Default to Green
let leftDPadUpPressed = false;
let leftDPadDownPressed = false;
let rightDPadUpPressed = false;
let rightDPadDownPressed = false;
let countdownValue = 5;
let countdownTimer = 0;
const countdownInterval = 1000; // 1 second per count
// UI elements for start/countdown messages
let leftStartMessageDiv;
let rightStartMessageDiv;
let leftColorSelectDiv;
let rightColorSelectDiv;
let leftCountdownDiv;
let rightCountdownDiv;
// Button press tracking for start button (button 9 = Start on Xbox controller)
let leftStartButtonPressed = false;
let rightStartButtonPressed = false;
// Stopwatch elements and timing
let leftStopwatchDiv;
let rightStopwatchDiv;
let stopwatchStartTime = 0;
let stopwatchRunning = false;
// Win condition tracking
let gameWon = false;
let winningPlayer = 0; // 1 for left, 2 for right
let winningTime = '';
let leftResultDiv;
let rightResultDiv;
let diamondVisible = true;
// Rematch tracking
let leftRematchDiv;
let rightRematchDiv;
let leftPlayerRematch = false;
let rightPlayerRematch = false;
let leftBackButtonPressed = false;
let rightBackButtonPressed = false;
// Health system
const MAX_HEALTH = 100;
let leftPlayerHealth = MAX_HEALTH;
let rightPlayerHealth = MAX_HEALTH;
let leftPlayerDead = false;
let rightPlayerDead = false;
let leftDeathScreenDiv;
let rightDeathScreenDiv;
const PUNCH_DAMAGE = 10;
const KICK_DAMAGE = 15;
// Track last hit to prevent multiple hits per attack
let leftPlayerLastHitTime = 0;
let rightPlayerLastHitTime = 0;
const HIT_COOLDOWN = 500; // milliseconds between hits
let shaderProgram;
let sunShaderProgram;
let skyboxShaderProgram;
let vaoGltf;
let sunVao;
let towerVao;
let wallVao;
let playerLeftVao;
let playerRightVao;
let skyboxVao;
let diamondVao;
let vao;
let skyboxTexture = null;
// Diamond position for end marker
let diamondPosition;
let diamondRotation = 0;
let platforms = [];
let clipFromEyeLeft;
let clipFromEyeRight;
let cameraLeft;
let cameraRight;
let worldFromModel;
let then = null;
let fpsCounter;
// Animation controllers for both players
let leftPlayerAnimController;
let rightPlayerAnimController;
let lightPosition = new Vector3(0, 0, 0);
let towerLightPositions = [];
let towerLightBobOffset = 0; // For bobbing animation
let currentLightTime = 0; // Current time for animations
let terrainCenterX;
let terrainCenterZ;
let terrainMinX;
let terrainMaxX;
let terrainMinZ;
let terrainMaxZ;
let sunOrbitRadius;
let sunHeight;
let grassTexture = null;
let platformTexture = null;
// Cache frequently used vectors to avoid allocations
const cachedUp = new Vector3(0, 0, 0);
const cachedForward = new Vector3(0, 0, 0);
const cachedRight = new Vector3(0, 0, 0);
// Camera movement parameters
let moveSpeedLeft = 0.01; // units per millisecond for left camera
const lookSpeedMouse = 0.24; // degrees per millisecond for mouse - match gamepad
const lookSpeedGamepad = 0.24; // degrees per millisecond - match keyboard speed
const deadzone = 0.15; // Joystick deadzone to prevent drift
const sprintMultiplier = 3.5; // Speed multiplier when sprinting
let pitchDegrees = 75; // Maximum pitch angle in degrees
// Gamepad to camera assignment
let leftCameraGamepadIndex = null;
let rightCameraGamepadIndex = null;
// Key state tracking
const keys = {};
// Konami code tracking
const KONAMI_CODE = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let konamiSequence = [];
let leftPlayerGodMode = false;
let rightPlayerGodMode = false;
const KONAMI_TIMEOUT = 3000; // Reset sequence after 3 seconds of inactivity
let lastKonamiInputTime = 0;
// Gamepad Konami code tracking
let leftGamepadKonamiSequence = [];
let rightGamepadKonamiSequence = [];
let lastLeftGamepadKonamiInputTime = 0;
let lastRightGamepadKonamiInputTime = 0;
// Button state tracking for edge detection
const leftGamepadButtonStates = [];
const rightGamepadButtonStates = [];
// Helper function to load GLTF and create both rendering VAO and collision mesh
async function createGltfObjectWithCollision(modelPath, position, rotation, scale) {
    // Load the GLTF model
    const gltfModel = await Gltf.readFromUrl(modelPath);
    const gltfMesh = gltfModel.meshes[0];
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
    // Normalize scale to Vector3
    const scaleVec = typeof scale === 'number' ? new Vector3(scale, scale, scale) : scale;
    // Apply transformations to collision mesh: scale, then rotate, then translate
    const transformedPositions = positions.map(pos => {
        // First scale in model space
        const scaled = new Vector3(pos.x * scaleVec.x, pos.y * scaleVec.y, pos.z * scaleVec.z);
        // Then rotate
        const rotated = rotation.multiplyVector3(scaled);
        // Finally translate
        return new Vector3(rotated.x + position.x, rotated.y + position.y, rotated.z + position.z);
    });
    const collisionMesh = new Trimesh(transformedPositions, faces);
    // Create VAO for rendering (uses the original GLTF data)
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', gltfMesh.positions.count, 3, gltfMesh.positions.buffer);
    attributes.addAttribute('normal', gltfMesh.normals.count, 3, gltfMesh.normals.buffer);
    // Add dummy skinning attributes for non-skinned models
    const dummyWeights = new Float32Array(gltfMesh.positions.count * 4).fill(0);
    const dummyJoints = new Float32Array(gltfMesh.positions.count * 4).fill(0);
    // Generate proper texture coordinates based on vertex positions
    // This creates a tiled brick pattern based on world-space coordinates
    const texCoords = new Float32Array(gltfMesh.positions.count * 2);
    const textureScale = 2.0; // How many times the texture repeats across the platform
    for (let i = 0; i < gltfMesh.positions.count; i++) {
        const x = gltfMesh.positions.buffer[i * 3];
        const z = gltfMesh.positions.buffer[i * 3 + 2];
        // Map X and Z coordinates to texture coordinates with scaling
        // Normalize to 0-1 range first, then scale
        // The platform model has dimensions roughly -4.3 to 4.3 in X and -3.0 to 3.0 in Z
        texCoords[i * 2] = ((x + 4.347) / (4.347 * 4)) * textureScale; // U coordinate (0 to textureScale)
        texCoords[i * 2 + 1] = ((z + 3.039) / (3.039 * 4)) * textureScale; // V coordinate (0 to textureScale)
    }
    attributes.addAttribute('weights', gltfMesh.positions.count, 4, dummyWeights);
    attributes.addAttribute('joints', gltfMesh.positions.count, 4, dummyJoints);
    attributes.addAttribute('texPosition', gltfMesh.positions.count, 2, texCoords);
    attributes.addIndices(new Uint32Array(gltfMesh.indices.buffer));
    const vao = new VertexArray(shaderProgram, attributes);
    return { vao, collisionMesh, position, rotation, scale };
}
async function initialize() {
    console.log('Initializing...');
    canvas = document.getElementById('canvas');
    console.log('Canvas:', canvas);
    window.gl = canvas.getContext('webgl2');
    console.log('WebGL2 context:', window.gl);
    if (!window.gl) {
        console.error('Failed to get WebGL2 context');
        return;
    }
    // Load CharacterLab models (separate instances for each player)
    modelLeft = await gltf.Model.readFromUrl('../../models/Josh.gltf');
    modelRight = await gltf.Model.readFromUrl('../../models/Josh.gltf');
    // Initialize animation controllers for both players with their own models
    leftPlayerAnimController = new AnimationController(modelLeft);
    rightPlayerAnimController = new AnimationController(modelRight);
    // Start both models with idle animation
    if (modelLeft.animations['idle']) {
        modelLeft.play('idle');
    }
    if (modelRight.animations['idle']) {
        modelRight.play('idle');
    }
    // Create health bar overlays (above compass, container + bar inside)
    healthBarLeftDiv = document.createElement('div');
    healthBarLeftDiv.style.position = 'absolute';
    healthBarLeftDiv.style.top = '20px';
    healthBarLeftDiv.style.right = 'calc(50% + 20px)';
    healthBarLeftDiv.style.width = '110px';
    healthBarLeftDiv.style.height = '26px';
    healthBarLeftDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    healthBarLeftDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    healthBarLeftDiv.style.pointerEvents = 'none';
    healthBarLeftDiv.style.zIndex = '1000';
    healthBarLeftDiv.innerHTML = '<div style="width: 110px; height: 100%; background-color: rgb(0, 255, 0);"></div>';
    document.body.appendChild(healthBarLeftDiv);
    healthBarRightDiv = document.createElement('div');
    healthBarRightDiv.style.position = 'absolute';
    healthBarRightDiv.style.top = '20px';
    healthBarRightDiv.style.right = '20px';
    healthBarRightDiv.style.width = '110px';
    healthBarRightDiv.style.height = '26px';
    healthBarRightDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    healthBarRightDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    healthBarRightDiv.style.pointerEvents = 'none';
    healthBarRightDiv.style.zIndex = '1000';
    healthBarRightDiv.innerHTML = '<div style="width: 110px; height: 100%; background-color: rgb(0, 255, 0);"></div>';
    document.body.appendChild(healthBarRightDiv);
    // Create compass overlays (moved down slightly to accommodate health bars)
    compassLeftDiv = document.createElement('div');
    compassLeftDiv.style.position = 'absolute';
    compassLeftDiv.style.top = '56px';
    compassLeftDiv.style.right = 'calc(50% + 20px)';
    compassLeftDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    compassLeftDiv.style.color = 'white';
    compassLeftDiv.style.padding = '5px 15px';
    compassLeftDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    compassLeftDiv.style.fontFamily = 'monospace';
    compassLeftDiv.style.fontSize = '18px';
    compassLeftDiv.style.fontWeight = 'bold';
    compassLeftDiv.style.textAlign = 'center';
    compassLeftDiv.style.pointerEvents = 'none';
    compassLeftDiv.style.zIndex = '1000';
    compassLeftDiv.style.minWidth = '80px';
    document.body.appendChild(compassLeftDiv);
    compassRightDiv = document.createElement('div');
    compassRightDiv.style.position = 'absolute';
    compassRightDiv.style.top = '56px';
    compassRightDiv.style.right = '20px';
    compassRightDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    compassRightDiv.style.color = 'white';
    compassRightDiv.style.padding = '5px 15px';
    compassRightDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    compassRightDiv.style.fontFamily = 'monospace';
    compassRightDiv.style.fontSize = '18px';
    compassRightDiv.style.fontWeight = 'bold';
    compassRightDiv.style.textAlign = 'center';
    compassRightDiv.style.pointerEvents = 'none';
    compassRightDiv.style.zIndex = '1000';
    compassRightDiv.style.minWidth = '80px';
    document.body.appendChild(compassRightDiv);
    // Create altimeter overlays (below compass)
    altimeterLeftDiv = document.createElement('div');
    altimeterLeftDiv.style.position = 'absolute';
    altimeterLeftDiv.style.top = '98px';
    altimeterLeftDiv.style.right = 'calc(50% + 20px)';
    ;
    ;
    ;
    ;
    ;
    altimeterLeftDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    altimeterLeftDiv.style.color = 'white';
    altimeterLeftDiv.style.padding = '5px 15px';
    altimeterLeftDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    altimeterLeftDiv.style.fontFamily = 'monospace';
    altimeterLeftDiv.style.fontSize = '18px';
    altimeterLeftDiv.style.fontWeight = 'bold';
    altimeterLeftDiv.style.textAlign = 'center';
    altimeterLeftDiv.style.pointerEvents = 'none';
    altimeterLeftDiv.style.zIndex = '1000';
    altimeterLeftDiv.style.minWidth = '80px';
    document.body.appendChild(altimeterLeftDiv);
    altimeterRightDiv = document.createElement('div');
    altimeterRightDiv.style.position = 'absolute';
    altimeterRightDiv.style.top = '98px';
    altimeterRightDiv.style.right = '20px';
    altimeterRightDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    altimeterRightDiv.style.color = 'white';
    altimeterRightDiv.style.padding = '5px 15px';
    altimeterRightDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    altimeterRightDiv.style.fontFamily = 'monospace';
    altimeterRightDiv.style.fontSize = '18px';
    altimeterRightDiv.style.fontWeight = 'bold';
    altimeterRightDiv.style.textAlign = 'center';
    altimeterRightDiv.style.pointerEvents = 'none';
    altimeterRightDiv.style.zIndex = '1000';
    altimeterRightDiv.style.minWidth = '80px';
    document.body.appendChild(altimeterRightDiv);
    // Create stopwatch overlays (below altimeter)
    leftStopwatchDiv = document.createElement('div');
    leftStopwatchDiv.style.position = 'absolute';
    leftStopwatchDiv.style.top = '140px';
    leftStopwatchDiv.style.right = 'calc(50% + 20px)';
    ;
    ;
    ;
    ;
    leftStopwatchDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    leftStopwatchDiv.style.color = 'white';
    leftStopwatchDiv.style.padding = '5px 15px';
    leftStopwatchDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    leftStopwatchDiv.style.fontFamily = 'monospace';
    leftStopwatchDiv.style.fontSize = '18px';
    leftStopwatchDiv.style.fontWeight = 'bold';
    leftStopwatchDiv.style.textAlign = 'center';
    leftStopwatchDiv.style.pointerEvents = 'none';
    leftStopwatchDiv.style.zIndex = '1000';
    leftStopwatchDiv.style.minWidth = '80px';
    leftStopwatchDiv.style.display = 'none'; // Hidden initially
    document.body.appendChild(leftStopwatchDiv);
    rightStopwatchDiv = document.createElement('div');
    rightStopwatchDiv.style.position = 'absolute';
    rightStopwatchDiv.style.top = '140px';
    rightStopwatchDiv.style.right = '20px';
    rightStopwatchDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    rightStopwatchDiv.style.color = 'white';
    rightStopwatchDiv.style.padding = '5px 15px';
    rightStopwatchDiv.style.border = '2px solid rgba(255, 255, 255, 0.8)';
    rightStopwatchDiv.style.fontFamily = 'monospace';
    rightStopwatchDiv.style.fontSize = '18px';
    rightStopwatchDiv.style.fontWeight = 'bold';
    rightStopwatchDiv.style.textAlign = 'center';
    rightStopwatchDiv.style.pointerEvents = 'none';
    rightStopwatchDiv.style.zIndex = '1000';
    rightStopwatchDiv.style.minWidth = '80px';
    rightStopwatchDiv.style.display = 'none'; // Hidden initially
    document.body.appendChild(rightStopwatchDiv);
    // Create result message overlays (center of each half)
    leftResultDiv = document.createElement('div');
    leftResultDiv.style.position = 'absolute';
    leftResultDiv.style.top = '50%';
    leftResultDiv.style.left = '25%';
    leftResultDiv.style.transform = 'translate(-50%, -50%)';
    leftResultDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    leftResultDiv.style.color = 'white';
    leftResultDiv.style.padding = '40px 30px';
    leftResultDiv.style.border = '4px solid rgba(255, 255, 255, 0.9)';
    leftResultDiv.style.fontFamily = 'monospace';
    leftResultDiv.style.fontSize = '32px';
    leftResultDiv.style.fontWeight = 'bold';
    leftResultDiv.style.textAlign = 'center';
    leftResultDiv.style.pointerEvents = 'none';
    leftResultDiv.style.zIndex = '3000';
    leftResultDiv.style.display = 'none'; // Hidden initially
    leftResultDiv.style.whiteSpace = 'pre-line';
    document.body.appendChild(leftResultDiv);
    rightResultDiv = document.createElement('div');
    rightResultDiv.style.position = 'absolute';
    rightResultDiv.style.top = '50%';
    rightResultDiv.style.left = '75%';
    rightResultDiv.style.transform = 'translate(-50%, -50%)';
    rightResultDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    rightResultDiv.style.color = 'white';
    rightResultDiv.style.padding = '40px 30px';
    rightResultDiv.style.border = '4px solid rgba(255, 255, 255, 0.9)';
    rightResultDiv.style.fontFamily = 'monospace';
    rightResultDiv.style.fontSize = '32px';
    rightResultDiv.style.fontWeight = 'bold';
    rightResultDiv.style.textAlign = 'center';
    rightResultDiv.style.pointerEvents = 'none';
    rightResultDiv.style.zIndex = '3000';
    rightResultDiv.style.display = 'none'; // Hidden initially
    rightResultDiv.style.whiteSpace = 'pre-line';
    document.body.appendChild(rightResultDiv);
    // Create rematch message overlays (top middle of each half)
    leftRematchDiv = document.createElement('div');
    leftRematchDiv.style.position = 'absolute';
    leftRematchDiv.style.top = '2.5%';
    leftRematchDiv.style.left = '25%';
    leftRematchDiv.style.transform = 'translateX(-50%)';
    leftRematchDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    leftRematchDiv.style.color = 'white';
    leftRematchDiv.style.padding = '20px 30px';
    leftRematchDiv.style.border = '3px solid rgba(255, 255, 255, 0.9)';
    leftRematchDiv.style.fontFamily = 'monospace';
    leftRematchDiv.style.fontSize = '24px';
    leftRematchDiv.style.fontWeight = 'bold';
    leftRematchDiv.style.textAlign = 'center';
    leftRematchDiv.style.pointerEvents = 'none';
    leftRematchDiv.style.zIndex = '3500';
    leftRematchDiv.style.whiteSpace = 'nowrap';
    leftRematchDiv.style.display = 'none'; // Hidden initially
    leftRematchDiv.innerHTML = 'Press the back button to run it back';
    document.body.appendChild(leftRematchDiv);
    rightRematchDiv = document.createElement('div');
    rightRematchDiv.style.position = 'absolute';
    rightRematchDiv.style.top = '2.5%';
    rightRematchDiv.style.left = '75%';
    rightRematchDiv.style.transform = 'translateX(-50%)';
    rightRematchDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    rightRematchDiv.style.color = 'white';
    rightRematchDiv.style.padding = '20px 30px';
    rightRematchDiv.style.border = '3px solid rgba(255, 255, 255, 0.9)';
    rightRematchDiv.style.fontFamily = 'monospace';
    rightRematchDiv.style.fontSize = '24px';
    rightRematchDiv.style.fontWeight = 'bold';
    rightRematchDiv.style.textAlign = 'center';
    rightRematchDiv.style.pointerEvents = 'none';
    rightRematchDiv.style.zIndex = '3500';
    rightRematchDiv.style.whiteSpace = 'nowrap';
    rightRematchDiv.style.display = 'none'; // Hidden initially
    rightRematchDiv.innerHTML = 'Press the back button to run it back';
    document.body.appendChild(rightRematchDiv);
    // Create death screen overlays
    leftDeathScreenDiv = document.createElement('div');
    leftDeathScreenDiv.style.position = 'absolute';
    leftDeathScreenDiv.style.top = '50%';
    leftDeathScreenDiv.style.left = '25%';
    leftDeathScreenDiv.style.transform = 'translate(-50%, -50%)';
    leftDeathScreenDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    leftDeathScreenDiv.style.color = 'red';
    leftDeathScreenDiv.style.padding = '40px 60px';
    leftDeathScreenDiv.style.border = '5px solid red';
    leftDeathScreenDiv.style.fontFamily = 'monospace';
    leftDeathScreenDiv.style.fontSize = '48px';
    leftDeathScreenDiv.style.fontWeight = 'bold';
    leftDeathScreenDiv.style.textAlign = 'center';
    leftDeathScreenDiv.style.pointerEvents = 'none';
    leftDeathScreenDiv.style.zIndex = '5000';
    leftDeathScreenDiv.style.display = 'none';
    leftDeathScreenDiv.innerHTML = 'YOU DIED<br><span style="font-size: 24px;">Press Start to Respawn</span>';
    document.body.appendChild(leftDeathScreenDiv);
    rightDeathScreenDiv = document.createElement('div');
    rightDeathScreenDiv.style.position = 'absolute';
    rightDeathScreenDiv.style.top = '50%';
    rightDeathScreenDiv.style.left = '75%';
    rightDeathScreenDiv.style.transform = 'translate(-50%, -50%)';
    rightDeathScreenDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    rightDeathScreenDiv.style.color = 'red';
    rightDeathScreenDiv.style.padding = '40px 60px';
    rightDeathScreenDiv.style.border = '5px solid red';
    rightDeathScreenDiv.style.fontFamily = 'monospace';
    rightDeathScreenDiv.style.fontSize = '48px';
    rightDeathScreenDiv.style.fontWeight = 'bold';
    rightDeathScreenDiv.style.textAlign = 'center';
    rightDeathScreenDiv.style.pointerEvents = 'none';
    rightDeathScreenDiv.style.zIndex = '5000';
    rightDeathScreenDiv.style.display = 'none';
    rightDeathScreenDiv.innerHTML = 'YOU DIED<br><span style="font-size: 24px;">Press Start to Respawn</span>';
    document.body.appendChild(rightDeathScreenDiv);
    // Create color selection overlays (below ready-up message)
    leftColorSelectDiv = document.createElement('div');
    leftColorSelectDiv.style.position = 'absolute';
    leftColorSelectDiv.style.top = '12%';
    leftColorSelectDiv.style.left = '25%';
    leftColorSelectDiv.style.transform = 'translateX(-50%)';
    leftColorSelectDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    leftColorSelectDiv.style.color = 'white';
    leftColorSelectDiv.style.padding = '15px 25px';
    leftColorSelectDiv.style.border = '3px solid rgba(255, 255, 255, 0.9)';
    leftColorSelectDiv.style.fontFamily = 'monospace';
    leftColorSelectDiv.style.fontSize = '20px';
    leftColorSelectDiv.style.fontWeight = 'bold';
    leftColorSelectDiv.style.textAlign = 'center';
    leftColorSelectDiv.style.pointerEvents = 'none';
    leftColorSelectDiv.style.zIndex = '3000';
    leftColorSelectDiv.style.whiteSpace = 'nowrap';
    const leftInitialColorRGB = PLAYER_COLORS[leftPlayerColorIndex].rgb;
    const leftInitialColorStyle = `rgb(${Math.round(leftInitialColorRGB.x * 255)}, ${Math.round(leftInitialColorRGB.y * 255)}, ${Math.round(leftInitialColorRGB.z * 255)})`;
    leftColorSelectDiv.innerHTML = `Color: <span style="color: ${leftInitialColorStyle};">${PLAYER_COLORS[leftPlayerColorIndex].name}</span><br><span style="font-size: 16px;">D-Pad Up/Down to change</span>`;
    document.body.appendChild(leftColorSelectDiv);
    rightColorSelectDiv = document.createElement('div');
    rightColorSelectDiv.style.position = 'absolute';
    rightColorSelectDiv.style.top = '12%';
    rightColorSelectDiv.style.left = '75%';
    rightColorSelectDiv.style.transform = 'translateX(-50%)';
    rightColorSelectDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    rightColorSelectDiv.style.color = 'white';
    rightColorSelectDiv.style.padding = '15px 25px';
    rightColorSelectDiv.style.border = '3px solid rgba(255, 255, 255, 0.9)';
    rightColorSelectDiv.style.fontFamily = 'monospace';
    rightColorSelectDiv.style.fontSize = '20px';
    rightColorSelectDiv.style.fontWeight = 'bold';
    rightColorSelectDiv.style.textAlign = 'center';
    rightColorSelectDiv.style.pointerEvents = 'none';
    rightColorSelectDiv.style.zIndex = '3000';
    rightColorSelectDiv.style.whiteSpace = 'nowrap';
    const rightInitialColorRGB = PLAYER_COLORS[rightPlayerColorIndex].rgb;
    const rightInitialColorStyle = `rgb(${Math.round(rightInitialColorRGB.x * 255)}, ${Math.round(rightInitialColorRGB.y * 255)}, ${Math.round(rightInitialColorRGB.z * 255)})`;
    rightColorSelectDiv.innerHTML = `Color: <span style="color: ${rightInitialColorStyle};">${PLAYER_COLORS[rightPlayerColorIndex].name}</span><br><span style="font-size: 16px;">D-Pad Up/Down to change</span>`;
    document.body.appendChild(rightColorSelectDiv);
    // Create start message overlays (top middle of each half)
    leftStartMessageDiv = document.createElement('div');
    leftStartMessageDiv.style.position = 'absolute';
    leftStartMessageDiv.style.top = '2.5%';
    leftStartMessageDiv.style.left = '25%';
    leftStartMessageDiv.style.transform = 'translateX(-50%)';
    leftStartMessageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    leftStartMessageDiv.style.color = 'white';
    leftStartMessageDiv.style.padding = '20px 30px';
    leftStartMessageDiv.style.border = '3px solid rgba(255, 255, 255, 0.9)';
    leftStartMessageDiv.style.fontFamily = 'monospace';
    leftStartMessageDiv.style.fontSize = '24px';
    leftStartMessageDiv.style.fontWeight = 'bold';
    leftStartMessageDiv.style.textAlign = 'center';
    leftStartMessageDiv.style.pointerEvents = 'none';
    leftStartMessageDiv.style.zIndex = '2000';
    leftStartMessageDiv.style.whiteSpace = 'nowrap';
    leftStartMessageDiv.innerHTML = 'Press the start button to ready up';
    document.body.appendChild(leftStartMessageDiv);
    rightStartMessageDiv = document.createElement('div');
    rightStartMessageDiv.style.position = 'absolute';
    rightStartMessageDiv.style.top = '2.5%';
    rightStartMessageDiv.style.left = '75%';
    rightStartMessageDiv.style.transform = 'translateX(-50%)';
    rightStartMessageDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    rightStartMessageDiv.style.color = 'white';
    rightStartMessageDiv.style.padding = '20px 30px';
    rightStartMessageDiv.style.border = '3px solid rgba(255, 255, 255, 0.9)';
    rightStartMessageDiv.style.fontFamily = 'monospace';
    rightStartMessageDiv.style.fontSize = '24px';
    rightStartMessageDiv.style.fontWeight = 'bold';
    rightStartMessageDiv.style.textAlign = 'center';
    rightStartMessageDiv.style.pointerEvents = 'none';
    rightStartMessageDiv.style.zIndex = '2000';
    rightStartMessageDiv.style.whiteSpace = 'nowrap';
    rightStartMessageDiv.innerHTML = 'Press the start button to ready up';
    document.body.appendChild(rightStartMessageDiv);
    // Create countdown overlays (center of each half)
    leftCountdownDiv = document.createElement('div');
    leftCountdownDiv.style.position = 'absolute';
    leftCountdownDiv.style.top = '50%';
    leftCountdownDiv.style.left = '25%';
    leftCountdownDiv.style.transform = 'translate(-50%, -50%)';
    leftCountdownDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    leftCountdownDiv.style.color = 'white';
    leftCountdownDiv.style.padding = '40px 60px';
    leftCountdownDiv.style.border = '4px solid rgba(255, 255, 255, 0.9)';
    leftCountdownDiv.style.fontFamily = 'monospace';
    leftCountdownDiv.style.fontSize = '72px';
    leftCountdownDiv.style.fontWeight = 'bold';
    leftCountdownDiv.style.textAlign = 'center';
    leftCountdownDiv.style.pointerEvents = 'none';
    leftCountdownDiv.style.zIndex = '2000';
    leftCountdownDiv.style.display = 'none'; // Hidden initially
    document.body.appendChild(leftCountdownDiv);
    rightCountdownDiv = document.createElement('div');
    rightCountdownDiv.style.position = 'absolute';
    rightCountdownDiv.style.top = '50%';
    rightCountdownDiv.style.left = '75%';
    rightCountdownDiv.style.transform = 'translate(-50%, -50%)';
    rightCountdownDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    rightCountdownDiv.style.color = 'white';
    rightCountdownDiv.style.padding = '40px 60px';
    rightCountdownDiv.style.border = '4px solid rgba(255, 255, 255, 0.9)';
    rightCountdownDiv.style.fontFamily = 'monospace';
    rightCountdownDiv.style.fontSize = '72px';
    rightCountdownDiv.style.fontWeight = 'bold';
    rightCountdownDiv.style.textAlign = 'center';
    rightCountdownDiv.style.pointerEvents = 'none';
    rightCountdownDiv.style.zIndex = '2000';
    rightCountdownDiv.style.display = 'none'; // Hidden initially
    document.body.appendChild(rightCountdownDiv);
    const jointCount = modelLeft.skinTransforms(0).length;
    const vertexSource = (await fetchText('flat-vertex.glsl')).replace('JOINT_TRANSFORM_COUNT', jointCount.toString());
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
    const factors = new Vector3(4, 25, 4);
    const mesh = heightField.toTrimesh(factors);
    mesh.computeNormals();
    const attributes = new VertexAttributes();
    attributes.addAttribute('position', mesh.vertexCount, 3, mesh.positionBuffer);
    attributes.addAttribute('normal', mesh.vertexCount, 3, mesh.normalBuffer);
    // Generate texture coordinates based on world position
    const terrainTexCoords = new Float32Array(mesh.vertexCount * 2);
    const textureScale = 0.01;
    for (let i = 0; i < mesh.vertexCount; i++) {
        const x = mesh.positions[i].x;
        const z = mesh.positions[i].z;
        terrainTexCoords[i * 2] = x * textureScale;
        terrainTexCoords[i * 2 + 1] = z * textureScale;
    }
    attributes.addAttribute('texPosition', mesh.vertexCount, 2, terrainTexCoords);
    // Add dummy skinning attributes for non-skinned terrain
    const dummyWeights = new Float32Array(mesh.vertexCount * 4).fill(0);
    const dummyJoints = new Float32Array(mesh.vertexCount * 4).fill(0);
    attributes.addAttribute('weights', mesh.vertexCount, 4, dummyWeights);
    attributes.addAttribute('joints', mesh.vertexCount, 4, dummyJoints);
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
    // Add dummy skinning attributes for non-skinned tower
    const towerDummyWeights = new Float32Array(towerModelMesh.positions.count * 4).fill(0);
    const towerDummyJoints = new Float32Array(towerModelMesh.positions.count * 4).fill(0);
    const towerDummyTexCoords = new Float32Array(towerModelMesh.positions.count * 2).fill(0);
    towerAttributes.addAttribute('weights', towerModelMesh.positions.count, 4, towerDummyWeights);
    towerAttributes.addAttribute('joints', towerModelMesh.positions.count, 4, towerDummyJoints);
    towerAttributes.addAttribute('texPosition', towerModelMesh.positions.count, 2, towerDummyTexCoords);
    towerAttributes.addIndices(new Uint32Array(towerModelMesh.indices.buffer));
    towerVao = new VertexArray(shaderProgram, towerAttributes);
    const wallMesh = await Gltf.readFromUrl('../../models/wall.gltf');
    const wallModelMesh = wallMesh.meshes[0];
    const wallAttributes = new VertexAttributes();
    wallAttributes.addAttribute('position', wallModelMesh.positions.count, 3, wallModelMesh.positions.buffer);
    wallAttributes.addAttribute('normal', wallModelMesh.normals.count, 3, wallModelMesh.normals.buffer);
    // Add dummy skinning attributes for non-skinned wall
    const wallDummyWeights = new Float32Array(wallModelMesh.positions.count * 4).fill(0);
    const wallDummyJoints = new Float32Array(wallModelMesh.positions.count * 4).fill(0);
    const wallDummyTexCoords = new Float32Array(wallModelMesh.positions.count * 2).fill(0);
    wallAttributes.addAttribute('weights', wallModelMesh.positions.count, 4, wallDummyWeights);
    wallAttributes.addAttribute('joints', wallModelMesh.positions.count, 4, wallDummyJoints);
    wallAttributes.addAttribute('texPosition', wallModelMesh.positions.count, 2, wallDummyTexCoords);
    wallAttributes.addIndices(new Uint32Array(wallModelMesh.indices.buffer));
    wallVao = new VertexArray(shaderProgram, wallAttributes);
    // Load diamond model for end marker
    const diamondMesh = await Gltf.readFromUrl('../../models/diamond.gltf');
    const diamondModelMesh = diamondMesh.meshes[0];
    const diamondAttributes = new VertexAttributes();
    diamondAttributes.addAttribute('position', diamondModelMesh.positions.count, 3, diamondModelMesh.positions.buffer);
    diamondAttributes.addAttribute('normal', diamondModelMesh.normals.count, 3, diamondModelMesh.normals.buffer);
    // Add dummy skinning attributes for diamond
    const diamondDummyWeights = new Float32Array(diamondModelMesh.positions.count * 4).fill(0);
    const diamondDummyJoints = new Float32Array(diamondModelMesh.positions.count * 4).fill(0);
    const diamondDummyTexCoords = new Float32Array(diamondModelMesh.positions.count * 2).fill(0);
    diamondAttributes.addAttribute('weights', diamondModelMesh.positions.count, 4, diamondDummyWeights);
    diamondAttributes.addAttribute('joints', diamondModelMesh.positions.count, 4, diamondDummyJoints);
    diamondAttributes.addAttribute('texPosition', diamondModelMesh.positions.count, 2, diamondDummyTexCoords);
    diamondAttributes.addIndices(new Uint32Array(diamondModelMesh.indices.buffer));
    diamondVao = new VertexArray(shaderProgram, diamondAttributes);
    // Create skybox
    const skyboxMesh = Prefab.skybox();
    const skyboxAttributes = new VertexAttributes();
    skyboxAttributes.addAttribute('position', skyboxMesh.vertexCount, 3, skyboxMesh.positionBuffer);
    skyboxAttributes.addIndices(skyboxMesh.faceBuffer);
    skyboxVao = new VertexArray(skyboxShaderProgram, skyboxAttributes);
    // Load cubemap texture
    skyboxTexture = await loadCubemap('./images/skybox/brown', 'jpg', gl.TEXTURE1);
    const platformLink = '../../models/platform.gltf';
    // Create player VAOs (one for each player) with their respective models
    const playerLeftAttributes = new VertexAttributes();
    playerLeftAttributes.addAttribute('position', modelLeft.meshes[0].positions.count, 3, modelLeft.meshes[0].positions.buffer);
    playerLeftAttributes.addAttribute('normal', modelLeft.meshes[0].normals.count, 3, modelLeft.meshes[0].normals.buffer);
    playerLeftAttributes.addAttribute('weights', modelLeft.meshes[0].weights.count, 4, modelLeft.meshes[0].weights.buffer);
    playerLeftAttributes.addAttribute('joints', modelLeft.meshes[0].joints.count, 4, new Float32Array(modelLeft.meshes[0].joints.buffer));
    // Add dummy texPosition attribute (2D, all zeros) to match shader expectations
    const dummyTexCoordsLeft = new Float32Array(modelLeft.meshes[0].positions.count * 2).fill(0);
    playerLeftAttributes.addAttribute('texPosition', modelLeft.meshes[0].positions.count, 2, dummyTexCoordsLeft);
    playerLeftAttributes.addIndices(new Uint32Array(modelLeft.meshes[0].indices.buffer));
    playerLeftVao = new VertexArray(shaderProgram, playerLeftAttributes);
    const playerRightAttributes = new VertexAttributes();
    playerRightAttributes.addAttribute('position', modelRight.meshes[0].positions.count, 3, modelRight.meshes[0].positions.buffer);
    playerRightAttributes.addAttribute('normal', modelRight.meshes[0].normals.count, 3, modelRight.meshes[0].normals.buffer);
    playerRightAttributes.addAttribute('weights', modelRight.meshes[0].weights.count, 4, modelRight.meshes[0].weights.buffer);
    playerRightAttributes.addAttribute('joints', modelRight.meshes[0].joints.count, 4, new Float32Array(modelRight.meshes[0].joints.buffer));
    // Add dummy texPosition attribute (2D, all zeros) to match shader expectations
    const dummyTexCoordsRight = new Float32Array(modelRight.meshes[0].positions.count * 2).fill(0);
    playerRightAttributes.addAttribute('texPosition', modelRight.meshes[0].positions.count, 2, dummyTexCoordsRight);
    playerRightAttributes.addIndices(new Uint32Array(modelRight.meshes[0].indices.buffer));
    playerRightVao = new VertexArray(shaderProgram, playerRightAttributes);
    let grassImage;
    // Load grass texture for the terrain
    try {
        grassImage = await fetchImage('./images/assets/brick.jpg');
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
    // Load platform texture
    try {
        const platformImage = await fetchImage('./images/assets/platform_brick.jpg');
        gl.activeTexture(gl.TEXTURE2);
        platformTexture = gl.createTexture();
        if (platformTexture) {
            gl.bindTexture(gl.TEXTURE_2D, platformTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, platformImage);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
    }
    catch (e) {
        console.warn('Failed to load platform texture:', e);
        platformTexture = null;
    }
    // Set texture uniforms once during initialization
    shaderProgram.bind();
    shaderProgram.setUniform1i('grassTexture', 0);
    shaderProgram.setUniform1i('platformTexture', 2);
    shaderProgram.unbind();
    // Calculate terrain center based on heightmap dimensions and factors
    terrainCenterX = (heightField.width - 1) / 2 * factors.x;
    terrainCenterZ = (heightField.height - 1) / 2 * factors.z;
    // Calculate terrain boundaries (inset by 20 units for overlap)
    terrainMinX = 20;
    terrainMaxX = (heightField.width - 1) * factors.x - 20;
    terrainMinZ = 20;
    terrainMaxZ = (heightField.height - 1) * factors.z - 20;
    // Find the maximum height value in the heightfield
    let maxHeight = 0;
    for (let i = 0; i < heightField.values.length; i++) {
        if (heightField.values[i] > maxHeight) {
            maxHeight = heightField.values[i];
        }
    }
    // Sun orbit parameters - will orbit above diamond
    sunOrbitRadius = 150; // Fixed radius around diamond
    sunHeight = maxHeight * factors.y + 7345; // Above the diamond (platformCenterY + 7195)
    // Initialize tower light positions matching tower corner positions
    const towerHeight = 450; // Height above ground for tower lights
    const terrainHalfWidth = terrainCenterX;
    const terrainHalfDepth = terrainCenterZ;
    towerLightPositions = [
        new Vector3(2 * terrainCenterX, towerHeight, 2 * terrainCenterZ), // Northeast
        new Vector3(0, towerHeight, 2 * terrainCenterZ), // Northwest
        new Vector3(2 * terrainCenterX, towerHeight, 0), // Southeast
        new Vector3(15, towerHeight, 15) // Southwest
    ];
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
    const offset = 80; // Camera height above terrain
    const worldUp = new Vector3(0, 1, 0);
    cameraLeft = new FirstPersonCamera(cameraPositionLeft, lookAtPointLeft, worldUp, heightField, offset, factors);
    cameraRight = new FirstPersonCamera(cameraPositionRight, lookAtPointRight, worldUp, heightField, offset, factors);
    cameraLeft.acceleration = .05;
    cameraRight.acceleration = .05;
    cameraLeft.meshInteractionEnabled = true;
    cameraRight.meshInteractionEnabled = true;
    // ========== CREATE PLATFORMS ==========
    // Platform positions are calculated relative to terrain center and max height
    const platformCenterY = maxHeight * factors.y + 150;
    // Platform 1: Main central platform
    const platform1 = await createGltfObjectWithCollision('../../models/platform.gltf', new Vector3(terrainCenterX, platformCenterY, terrainCenterZ), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform1.collisionMesh);
    cameraRight.addMesh(platform1.collisionMesh);
    platforms.push({
        vao: platform1.vao,
        position: platform1.position,
        rotation: platform1.rotation,
        scale: platform1.scale
    });
    // Platform 2: Elevated side platform
    const platform2 = await createGltfObjectWithCollision('../../models/platform.gltf', new Vector3(terrainCenterX + 200, platformCenterY + 100, terrainCenterZ + 160), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform2.collisionMesh);
    cameraRight.addMesh(platform2.collisionMesh);
    platforms.push({
        vao: platform2.vao,
        position: platform2.position,
        rotation: platform2.rotation,
        scale: platform2.scale
    });
    // Platform 3
    const platform3 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 200, platformCenterY + 200, terrainCenterZ - 150), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform3.collisionMesh);
    cameraRight.addMesh(platform3.collisionMesh);
    platforms.push({
        vao: platform3.vao,
        position: platform3.position,
        rotation: platform3.rotation,
        scale: platform3.scale
    });
    // Platform 4
    const platform4 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 180, platformCenterY + 320, terrainCenterZ - 180), Matrix4.rotateX(0), new Vector3(15, 15, 15));
    cameraLeft.addMesh(platform4.collisionMesh);
    cameraRight.addMesh(platform4.collisionMesh);
    platforms.push({
        vao: platform4.vao,
        position: platform4.position,
        rotation: platform4.rotation,
        scale: platform4.scale
    });
    // Platform 5
    const platform5 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 150, platformCenterY + 470, terrainCenterZ + 190), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform5.collisionMesh);
    cameraRight.addMesh(platform5.collisionMesh);
    platforms.push({
        vao: platform5.vao,
        position: platform5.position,
        rotation: platform5.rotation,
        scale: platform5.scale
    });
    // Platform 6
    const platform6 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 210, platformCenterY + 620, terrainCenterZ + 170), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform6.collisionMesh);
    cameraRight.addMesh(platform6.collisionMesh);
    platforms.push({
        vao: platform6.vao,
        position: platform6.position,
        rotation: platform6.rotation,
        scale: platform6.scale
    });
    // Platform 7
    const platform7 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 190, platformCenterY + 770, terrainCenterZ - 160), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform7.collisionMesh);
    cameraRight.addMesh(platform7.collisionMesh);
    platforms.push({
        vao: platform7.vao,
        position: platform7.position,
        rotation: platform7.rotation,
        scale: platform7.scale
    });
    // Platform 8
    const platform8 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 170, platformCenterY + 920, terrainCenterZ - 200), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform8.collisionMesh);
    cameraRight.addMesh(platform8.collisionMesh);
    platforms.push({
        vao: platform8.vao,
        position: platform8.position,
        rotation: platform8.rotation,
        scale: platform8.scale
    });
    // Platform 9
    const platform9 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 180, platformCenterY + 1070, terrainCenterZ + 180), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform9.collisionMesh);
    cameraRight.addMesh(platform9.collisionMesh);
    platforms.push({
        vao: platform9.vao,
        position: platform9.position,
        rotation: platform9.rotation,
        scale: platform9.scale
    });
    // Platform 10
    const platform10 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 190, platformCenterY + 1220, terrainCenterZ + 150), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform10.collisionMesh);
    cameraRight.addMesh(platform10.collisionMesh);
    platforms.push({
        vao: platform10.vao,
        position: platform10.position,
        rotation: platform10.rotation,
        scale: platform10.scale
    });
    // Platform 11
    const platform11 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 170, platformCenterY + 1370, terrainCenterZ - 170), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform11.collisionMesh);
    cameraRight.addMesh(platform11.collisionMesh);
    platforms.push({
        vao: platform11.vao,
        position: platform11.position,
        rotation: platform11.rotation,
        scale: platform11.scale
    });
    // Platform 12
    const platform12 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 160, platformCenterY + 1520, terrainCenterZ - 190), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform12.collisionMesh);
    cameraRight.addMesh(platform12.collisionMesh);
    platforms.push({
        vao: platform12.vao,
        position: platform12.position,
        rotation: platform12.rotation,
        scale: platform12.scale
    });
    // Platform 13
    const platform13 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 190, platformCenterY + 1670, terrainCenterZ + 160), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform13.collisionMesh);
    cameraRight.addMesh(platform13.collisionMesh);
    platforms.push({
        vao: platform13.vao,
        position: platform13.position,
        rotation: platform13.rotation,
        scale: platform13.scale
    });
    // Platform 14
    const platform14 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 180, platformCenterY + 1820, terrainCenterZ - 180), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform14.collisionMesh);
    cameraRight.addMesh(platform14.collisionMesh);
    platforms.push({
        vao: platform14.vao,
        position: platform14.position,
        rotation: platform14.rotation,
        scale: platform14.scale
    });
    // Platform 15
    const platform15 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 200, platformCenterY + 1970, terrainCenterZ - 150), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform15.collisionMesh);
    cameraRight.addMesh(platform15.collisionMesh);
    platforms.push({
        vao: platform15.vao,
        position: platform15.position,
        rotation: platform15.rotation,
        scale: platform15.scale
    });
    // Platform 16
    const platform16 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 170, platformCenterY + 2120, terrainCenterZ + 190), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform16.collisionMesh);
    cameraRight.addMesh(platform16.collisionMesh);
    platforms.push({
        vao: platform16.vao,
        position: platform16.position,
        rotation: platform16.rotation,
        scale: platform16.scale
    });
    // Platform 17
    const platform17 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 185, platformCenterY + 2270, terrainCenterZ + 175), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform17.collisionMesh);
    cameraRight.addMesh(platform17.collisionMesh);
    platforms.push({
        vao: platform17.vao,
        position: platform17.position,
        rotation: platform17.rotation,
        scale: platform17.scale
    });
    // Platform 18
    const platform18 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 195, platformCenterY + 2420, terrainCenterZ - 165), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform18.collisionMesh);
    cameraRight.addMesh(platform18.collisionMesh);
    platforms.push({
        vao: platform18.vao,
        position: platform18.position,
        rotation: platform18.rotation,
        scale: platform18.scale
    });
    // Platform 19
    const platform19 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 175, platformCenterY + 2570, terrainCenterZ - 185), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform19.collisionMesh);
    cameraRight.addMesh(platform19.collisionMesh);
    platforms.push({
        vao: platform19.vao,
        position: platform19.position,
        rotation: platform19.rotation,
        scale: platform19.scale
    });
    // Platform 20
    const platform20 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 160, platformCenterY + 2720, terrainCenterZ + 180), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform20.collisionMesh);
    cameraRight.addMesh(platform20.collisionMesh);
    platforms.push({
        vao: platform20.vao,
        position: platform20.position,
        rotation: platform20.rotation,
        scale: platform20.scale
    });
    // Platform 21
    const platform21 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 190, platformCenterY + 2870, terrainCenterZ + 170), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform21.collisionMesh);
    cameraRight.addMesh(platform21.collisionMesh);
    platforms.push({
        vao: platform21.vao,
        position: platform21.position,
        rotation: platform21.rotation,
        scale: platform21.scale
    });
    // Platform 22
    const platform22 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 185, platformCenterY + 3020, terrainCenterZ - 175), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform22.collisionMesh);
    cameraRight.addMesh(platform22.collisionMesh);
    platforms.push({
        vao: platform22.vao,
        position: platform22.position,
        rotation: platform22.rotation,
        scale: platform22.scale
    });
    // Platform 23
    const platform23 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 165, platformCenterY + 3170, terrainCenterZ - 195), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform23.collisionMesh);
    cameraRight.addMesh(platform23.collisionMesh);
    platforms.push({
        vao: platform23.vao,
        position: platform23.position,
        rotation: platform23.rotation,
        scale: platform23.scale
    });
    // Platform 24
    const platform24 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 200, platformCenterY + 3320, terrainCenterZ + 185), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform24.collisionMesh);
    cameraRight.addMesh(platform24.collisionMesh);
    platforms.push({
        vao: platform24.vao,
        position: platform24.position,
        rotation: platform24.rotation,
        scale: platform24.scale
    });
    // Platform 25
    const platform25 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 180, platformCenterY + 3470, terrainCenterZ + 160), Matrix4.rotateX(0), 15);
    cameraLeft.addMesh(platform25.collisionMesh);
    cameraRight.addMesh(platform25.collisionMesh);
    platforms.push({
        vao: platform25.vao,
        position: platform25.position,
        rotation: platform25.rotation,
        scale: platform25.scale
    });
    // Platform 26 - Thin rail (narrow in X, normal in Z)
    const platform26 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 190, platformCenterY + 3620, terrainCenterZ - 170), Matrix4.rotateX(0), new Vector3(6, 15, 15));
    cameraLeft.addMesh(platform26.collisionMesh);
    cameraRight.addMesh(platform26.collisionMesh);
    platforms.push({
        vao: platform26.vao,
        position: platform26.position,
        rotation: platform26.rotation,
        scale: platform26.scale
    });
    // Platform 27 - Wide platform
    const platform27 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 160, platformCenterY + 3770, terrainCenterZ - 190), Matrix4.rotateX(0), new Vector3(20, 15, 20));
    cameraLeft.addMesh(platform27.collisionMesh);
    cameraRight.addMesh(platform27.collisionMesh);
    platforms.push({
        vao: platform27.vao,
        position: platform27.position,
        rotation: platform27.rotation,
        scale: platform27.scale
    });
    // Platform 28 - Thin rail (narrow in Z, normal in X)
    const platform28 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 175, platformCenterY + 3920, terrainCenterZ + 185), Matrix4.rotateX(0), new Vector3(15, 15, 6));
    cameraLeft.addMesh(platform28.collisionMesh);
    cameraRight.addMesh(platform28.collisionMesh);
    platforms.push({
        vao: platform28.vao,
        position: platform28.position,
        rotation: platform28.rotation,
        scale: platform28.scale
    });
    // Platform 29 - Stair-like (tall and narrow)
    const platform29 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 185, platformCenterY + 4070, terrainCenterZ + 170), Matrix4.rotateX(0), new Vector3(15, 20, 15));
    cameraLeft.addMesh(platform29.collisionMesh);
    cameraRight.addMesh(platform29.collisionMesh);
    platforms.push({
        vao: platform29.vao,
        position: platform29.position,
        rotation: platform29.rotation,
        scale: platform29.scale
    });
    // Platform 30 - Small square
    const platform30 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 195, platformCenterY + 4220, terrainCenterZ - 180), Matrix4.rotateX(0), new Vector3(13, 15, 13));
    cameraLeft.addMesh(platform30.collisionMesh);
    cameraRight.addMesh(platform30.collisionMesh);
    platforms.push({
        vao: platform30.vao,
        position: platform30.position,
        rotation: platform30.rotation,
        scale: platform30.scale
    });
    // Platform 31 - Long rail diagonal
    const platform31 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 170, platformCenterY + 4370, terrainCenterZ - 195), Matrix4.rotateY(45), new Vector3(25, 15, 6));
    cameraLeft.addMesh(platform31.collisionMesh);
    cameraRight.addMesh(platform31.collisionMesh);
    platforms.push({
        vao: platform31.vao,
        position: platform31.position,
        rotation: platform31.rotation,
        scale: platform31.scale
    });
    // Platform 32 - Extra wide landing
    const platform32 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 180, platformCenterY + 4520, terrainCenterZ + 175), Matrix4.rotateX(0), new Vector3(25, 15, 25));
    cameraLeft.addMesh(platform32.collisionMesh);
    cameraRight.addMesh(platform32.collisionMesh);
    platforms.push({
        vao: platform32.vao,
        position: platform32.position,
        rotation: platform32.rotation,
        scale: platform32.scale
    });
    // Platform 33 - Thin vertical rail
    const platform33 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 190, platformCenterY + 4670, terrainCenterZ + 165), Matrix4.rotateX(0), new Vector3(7, 15, 15));
    cameraLeft.addMesh(platform33.collisionMesh);
    cameraRight.addMesh(platform33.collisionMesh);
    platforms.push({
        vao: platform33.vao,
        position: platform33.position,
        rotation: platform33.rotation,
        scale: platform33.scale
    });
    // Platform 34 - Stair step (short and wide)
    const platform34 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 185, platformCenterY + 4820, terrainCenterZ - 175), Matrix4.rotateX(0), new Vector3(18, 10, 18));
    cameraLeft.addMesh(platform34.collisionMesh);
    cameraRight.addMesh(platform34.collisionMesh);
    platforms.push({
        vao: platform34.vao,
        position: platform34.position,
        rotation: platform34.rotation,
        scale: platform34.scale
    });
    // Platform 35 - Rectangular long platform
    const platform35 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 165, platformCenterY + 4970, terrainCenterZ - 185), Matrix4.rotateX(0), new Vector3(20, 15, 15));
    cameraLeft.addMesh(platform35.collisionMesh);
    cameraRight.addMesh(platform35.collisionMesh);
    platforms.push({
        vao: platform35.vao,
        position: platform35.position,
        rotation: platform35.rotation,
        scale: platform35.scale
    });
    // Platform 36 - Tiny platform
    const platform36 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 200, platformCenterY + 5120, terrainCenterZ + 190), Matrix4.rotateX(0), new Vector3(12, 15, 12));
    cameraLeft.addMesh(platform36.collisionMesh);
    cameraRight.addMesh(platform36.collisionMesh);
    platforms.push({
        vao: platform36.vao,
        position: platform36.position,
        rotation: platform36.rotation,
        scale: platform36.scale
    });
    // Platform 37 - Cross-shaped rail
    const platform37 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 175, platformCenterY + 5270, terrainCenterZ + 180), Matrix4.rotateX(0), new Vector3(6, 15, 20));
    cameraLeft.addMesh(platform37.collisionMesh);
    cameraRight.addMesh(platform37.collisionMesh);
    platforms.push({
        vao: platform37.vao,
        position: platform37.position,
        rotation: platform37.rotation,
        scale: platform37.scale
    });
    // Platform 38 - Medium stair step
    const platform38 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 190, platformCenterY + 5420, terrainCenterZ - 170), Matrix4.rotateX(0), new Vector3(15, 18, 15));
    cameraLeft.addMesh(platform38.collisionMesh);
    cameraRight.addMesh(platform38.collisionMesh);
    platforms.push({
        vao: platform38.vao,
        position: platform38.position,
        rotation: platform38.rotation,
        scale: platform38.scale
    });
    // Platform 39 - Ultra-thin balance beam
    const platform39 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 180, platformCenterY + 5570, terrainCenterZ - 160), Matrix4.rotateY(30), new Vector3(5, 15, 20));
    cameraLeft.addMesh(platform39.collisionMesh);
    cameraRight.addMesh(platform39.collisionMesh);
    platforms.push({
        vao: platform39.vao,
        position: platform39.position,
        rotation: platform39.rotation,
        scale: platform39.scale
    });
    // Platform 40
    const platform40 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 0, platformCenterY + 5720, terrainCenterZ + 0), Matrix4.rotateX(0), new Vector3(30, 15, 30));
    cameraLeft.addMesh(platform40.collisionMesh);
    cameraRight.addMesh(platform40.collisionMesh);
    platforms.push({
        vao: platform40.vao,
        position: platform40.position,
        rotation: platform40.rotation,
        scale: platform40.scale
    });
    // ===== FINAL SECTION: Wider spacing platforms =====
    // Platform 41
    const platform41 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 280, platformCenterY + 5920, terrainCenterZ + 250), Matrix4.rotateX(0), new Vector3(15, 15, 15));
    cameraLeft.addMesh(platform41.collisionMesh);
    cameraRight.addMesh(platform41.collisionMesh);
    platforms.push({
        vao: platform41.vao,
        position: platform41.position,
        rotation: platform41.rotation,
        scale: platform41.scale
    });
    // Platform 42
    const platform42 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 290, platformCenterY + 6020, terrainCenterZ - 260), Matrix4.rotateX(0), new Vector3(13, 15, 13));
    cameraLeft.addMesh(platform42.collisionMesh);
    cameraRight.addMesh(platform42.collisionMesh);
    platforms.push({
        vao: platform42.vao,
        position: platform42.position,
        rotation: platform42.rotation,
        scale: platform42.scale
    });
    // Platform 43
    const platform43 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 270, platformCenterY + 6320, terrainCenterZ - 280), Matrix4.rotateX(0), new Vector3(35, 15, 35));
    cameraLeft.addMesh(platform43.collisionMesh);
    cameraRight.addMesh(platform43.collisionMesh);
    platforms.push({
        vao: platform43.vao,
        position: platform43.position,
        rotation: platform43.rotation,
        scale: platform43.scale
    });
    // Platform 44
    const platform44 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 300, platformCenterY + 6520, terrainCenterZ + 270), Matrix4.rotateX(0), new Vector3(27, 15, 27));
    cameraLeft.addMesh(platform44.collisionMesh);
    cameraRight.addMesh(platform44.collisionMesh);
    platforms.push({
        vao: platform44.vao,
        position: platform44.position,
        rotation: platform44.rotation,
        scale: platform44.scale
    });
    // Platform 45
    const platform45 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX - 290, platformCenterY + 6720, terrainCenterZ + 260), Matrix4.rotateX(0), new Vector3(27, 15, 37));
    cameraLeft.addMesh(platform45.collisionMesh);
    cameraRight.addMesh(platform45.collisionMesh);
    platforms.push({
        vao: platform45.vao,
        position: platform45.position,
        rotation: platform45.rotation,
        scale: platform45.scale
    });
    // Platform 46 - FINAL EXTRA WIDE LANDING
    const platform46 = await createGltfObjectWithCollision(platformLink, new Vector3(terrainCenterX + 0, platformCenterY + 6920, terrainCenterZ + 0), Matrix4.rotateX(0), new Vector3(40, 15, 40));
    cameraLeft.addMesh(platform46.collisionMesh);
    cameraRight.addMesh(platform46.collisionMesh);
    platforms.push({
        vao: platform46.vao,
        position: platform46.position,
        rotation: platform46.rotation,
        scale: platform46.scale
    });
    // Set diamond position above final platform
    diamondPosition = new Vector3(terrainCenterX, platformCenterY + 6995, terrainCenterZ);
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
            // No render() call needed - the animation loop handles it
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
    // Track Konami code sequence
    const currentTime = Date.now();
    const key = event.key.toLowerCase();
    // Reset sequence if too much time has passed
    if (currentTime - lastKonamiInputTime > KONAMI_TIMEOUT) {
        konamiSequence = [];
    }
    lastKonamiInputTime = currentTime;
    // Add key to sequence
    konamiSequence.push(key);
    // Keep only the last 10 keys (length of Konami code)
    if (konamiSequence.length > KONAMI_CODE.length) {
        konamiSequence.shift();
    }
    // Check if sequence matches Konami code
    if (konamiSequence.length === KONAMI_CODE.length) {
        const matches = konamiSequence.every((key, index) => key === KONAMI_CODE[index]);
        if (matches && gameState === GameState.PLAYING) {
            // Activate god mode for left player (keyboard player)
            leftPlayerGodMode = !leftPlayerGodMode; // Toggle god mode
            console.log(`Left player god mode: ${leftPlayerGodMode ? 'ACTIVATED' : 'DEACTIVATED'}`);
            // Visual/audio feedback
            if (leftPlayerGodMode) {
                // Flash the screen or show a message
                document.body.style.transition = 'background-color 0.3s';
                document.body.style.backgroundColor = 'gold';
                setTimeout(() => {
                    document.body.style.backgroundColor = '';
                }, 300);
            }
            // Reset sequence
            konamiSequence = [];
        }
        else if (matches) {
            // Reset sequence even if game hasn't started
            konamiSequence = [];
        }
    }
}
function handleKeyUp(event) {
    keys[event.key.toLowerCase()] = false;
}
let currentPitch = 0;
function checkBothPlayersReady() {
    if (leftPlayerReady && rightPlayerReady) {
        // Both players ready, start countdown
        gameState = GameState.COUNTDOWN;
        leftStartMessageDiv.style.display = 'none';
        rightStartMessageDiv.style.display = 'none';
        leftCountdownDiv.style.display = 'block';
        rightCountdownDiv.style.display = 'block';
        countdownValue = 5;
        countdownTimer = 0;
        updateCountdownDisplay();
    }
}
function updateCountdownDisplay() {
    if (countdownValue > 0) {
        leftCountdownDiv.innerHTML = countdownValue.toString();
        rightCountdownDiv.innerHTML = countdownValue.toString();
    }
    else {
        leftCountdownDiv.innerHTML = 'Ascend!';
        rightCountdownDiv.innerHTML = 'Ascend!';
    }
}
function updateGameState(elapsed) {
    if (gameState === GameState.COUNTDOWN) {
        countdownTimer += elapsed;
        if (countdownTimer >= countdownInterval) {
            countdownTimer -= countdownInterval;
            countdownValue--;
            if (countdownValue > 0) {
                // Show numbers 4, 3, 2, 1
                updateCountdownDisplay();
            }
            else if (countdownValue === 0) {
                // Show "Ascend!"
                updateCountdownDisplay();
            }
            else {
                // countdownValue is now -1, countdown finished, start playing
                gameState = GameState.PLAYING;
                leftCountdownDiv.style.display = 'none';
                rightCountdownDiv.style.display = 'none';
                // Start the stopwatch
                stopwatchRunning = true;
                stopwatchStartTime = Date.now();
                leftStopwatchDiv.style.display = 'block';
                rightStopwatchDiv.style.display = 'block';
            }
        }
    }
}
function updateStopwatch() {
    if (stopwatchRunning) {
        const elapsedMs = Date.now() - stopwatchStartTime;
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((elapsedMs % 1000) / 10); // Two digits for ms
        // Format as MM:SS.MS
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
        leftStopwatchDiv.innerHTML = timeString;
        rightStopwatchDiv.innerHTML = timeString;
        // Store as winning time for later use
        winningTime = timeString;
    }
}
function checkDiamondCollision() {
    if (gameWon || !diamondVisible || gameState !== GameState.PLAYING) {
        return;
    }
    const collisionRadius = 30; // Distance to trigger win
    // Check left player collision with diamond
    const leftDistance = cameraLeft.from.subtract(diamondPosition).magnitude;
    if (leftDistance < collisionRadius) {
        handleWin(1);
        return;
    }
    // Check right player collision with diamond
    const rightDistance = cameraRight.from.subtract(diamondPosition).magnitude;
    if (rightDistance < collisionRadius) {
        handleWin(2);
        return;
    }
}
function handleWin(playerNumber) {
    gameWon = true;
    winningPlayer = playerNumber;
    stopwatchRunning = false; // Stop the stopwatch
    diamondVisible = false; // Hide the diamond
    // Get winner's color
    const winnerColorName = playerNumber === 1 ? PLAYER_COLORS[leftPlayerColorIndex].name : PLAYER_COLORS[rightPlayerColorIndex].name;
    const winnerColorRGB = playerNumber === 1 ? PLAYER_COLORS[leftPlayerColorIndex].rgb : PLAYER_COLORS[rightPlayerColorIndex].rgb;
    const colorStyle = `rgb(${Math.round(winnerColorRGB.x * 255)}, ${Math.round(winnerColorRGB.y * 255)}, ${Math.round(winnerColorRGB.z * 255)})`;
    // Show winner message with their color
    if (playerNumber === 1) {
        leftResultDiv.innerHTML = `<span style="color: ${colorStyle};">${winnerColorName}</span> wins!\nTime: ${winningTime}`;
        leftResultDiv.style.display = 'block';
        rightResultDiv.innerHTML = `Keep that head up twin,\nyou almost had it!`;
        rightResultDiv.style.display = 'block';
    }
    else {
        rightResultDiv.innerHTML = `<span style="color: ${colorStyle};">${winnerColorName}</span> wins!\nTime: ${winningTime}`;
        rightResultDiv.style.display = 'block';
        leftResultDiv.innerHTML = `Keep that head up twin,\nyou almost had it!`;
        leftResultDiv.style.display = 'block';
    }
    // Show rematch buttons
    leftRematchDiv.style.display = 'block';
    rightRematchDiv.style.display = 'block';
}
function checkRematchButtons() {
    if (!gameWon)
        return;
    const gamepads = navigator.getGamepads();
    const leftGamepad = leftCameraGamepadIndex !== null ? gamepads[leftCameraGamepadIndex] : null;
    const rightGamepad = rightCameraGamepadIndex !== null ? gamepads[rightCameraGamepadIndex] : null;
    // Check left player back button (button 8)
    if (leftGamepad) {
        const backPressed = leftGamepad.buttons[8]?.pressed || false;
        if (backPressed && !leftBackButtonPressed) {
            leftPlayerRematch = true;
            leftRematchDiv.innerHTML = 'Ready! Waiting for other player...';
            leftRematchDiv.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
        }
        leftBackButtonPressed = backPressed;
    }
    // Check right player back button (button 8)
    if (rightGamepad) {
        const backPressed = rightGamepad.buttons[8]?.pressed || false;
        if (backPressed && !rightBackButtonPressed) {
            rightPlayerRematch = true;
            rightRematchDiv.innerHTML = 'Ready! Waiting for other player...';
            rightRematchDiv.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
        }
        rightBackButtonPressed = backPressed;
    }
    // If both players ready, reload the page
    if (leftPlayerRematch && rightPlayerRematch) {
        location.reload();
    }
}
function updateCamera(elapsed) {
    const gamepads = navigator.getGamepads();
    // Get the gamepads assigned to each camera
    const leftGamepad = leftCameraGamepadIndex !== null ? gamepads[leftCameraGamepadIndex] : null;
    const rightGamepad = rightCameraGamepadIndex !== null ? gamepads[rightCameraGamepadIndex] : null;
    // Update left camera
    if (leftGamepad) {
        // Always process gamepad if connected (for button state tracking like D-pad)
        updateCameraWithGamepad(cameraLeft, leftGamepad, elapsed);
        // Also allow keyboard control if gamepad sticks aren't being used
        const deadzone = 0.15;
        const hasStickInput = Math.abs(leftGamepad.axes[0]) > deadzone ||
            Math.abs(leftGamepad.axes[1]) > deadzone ||
            Math.abs(leftGamepad.axes[2]) > deadzone ||
            Math.abs(leftGamepad.axes[3]) > deadzone;
        if (!hasStickInput) {
            // Allow keyboard movement when gamepad sticks are neutral
            updateCameraWithKeyboard(cameraLeft, elapsed);
        }
    }
    else {
        // No gamepad connected, use keyboard only
        updateCameraWithKeyboard(cameraLeft, elapsed);
    }
    // Update right camera
    if (rightGamepad) {
        // Right camera controlled by assigned gamepad
        updateCameraWithGamepad(cameraRight, rightGamepad, elapsed);
    }
    // If no gamepad assigned to right camera, it doesn't move
}
function clampCameraToTerrain(camera) {
    // Clamp camera X position to terrain bounds
    if (camera.from.x < terrainMinX) {
        camera.from.x = terrainMinX;
    }
    else if (camera.from.x > terrainMaxX) {
        camera.from.x = terrainMaxX;
    }
    // Clamp camera Z position to terrain bounds
    if (camera.from.z < terrainMinZ) {
        camera.from.z = terrainMinZ;
    }
    else if (camera.from.z > terrainMaxZ) {
        camera.from.z = terrainMaxZ;
    }
    // Update camera orientation after position change
    camera.reorient();
}
function updateCameraWithKeyboard(camera, elapsed) {
    // Determine which player this is
    const animController = camera === cameraLeft ? leftPlayerAnimController : rightPlayerAnimController;
    // Don't allow movement if player is dead
    if (camera === cameraLeft && leftPlayerDead) {
        return;
    }
    // Handle shift for sprint - use local variable to avoid conflicts with gamepad
    const baseSpeed = .2;
    // Block keyboard movement during countdown phase only
    if (gameState === GameState.COUNTDOWN) {
        return;
    }
    let keyboardSpeed = baseSpeed;
    if (keys['shift']) {
        keyboardSpeed = baseSpeed * sprintMultiplier;
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
    // Determine if player is moving
    const isMoving = inputForward !== 0 || inputStrafe !== 0;
    // Request walk animation when moving, idle when not (if not jumping)
    if (camera === cameraLeft) { // Only control left player animation with keyboard
        if (!camera.isJumping) {
            if (isMoving) {
                animController.requestAnimation(AnimationState.WALK);
            }
            else {
                animController.requestAnimation(AnimationState.IDLE);
            }
        }
    }
    // Update momentum based on input
    camera.updateMomentum(inputForward, inputStrafe);
    // Apply movement with momentum
    camera.applyMomentumMovement(elapsed * keyboardSpeed);
    // Clamp camera position to terrain boundaries
    clampCameraToTerrain(camera);
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
    // Enter key to exit god mode or respawn (keyboard player only)
    if (keys['enter'] && camera === cameraLeft) {
        // Respawn if dead
        if (leftPlayerDead) {
            respawnPlayer(true);
            keys['enter'] = false;
        }
        // Exit god mode if alive
        else if (leftPlayerGodMode) {
            leftPlayerGodMode = false;
            console.log('Left player god mode: DEACTIVATED');
            keys['enter'] = false; // Prevent repeated toggles
        }
    }
}
function checkGamepadKonamiCode(gamepad, sequence, lastInputTime, buttonStates) {
    const currentTime = Date.now();
    let activated = false;
    // Initialize button states array if needed
    while (buttonStates.length < 16) {
        buttonStates.push(false);
    }
    // Map gamepad buttons to Konami code inputs
    // D-pad: up=12, down=13, left=14, right=15, B=1, A=0
    const buttonMapping = {
        12: 'arrowup',
        13: 'arrowdown',
        14: 'arrowleft',
        15: 'arrowright',
        1: 'b',
        0: 'a'
    };
    // Check for button presses (edge detection)
    for (const [buttonIndex, konamiKey] of Object.entries(buttonMapping)) {
        const index = parseInt(buttonIndex);
        const isPressed = gamepad.buttons[index]?.pressed || false;
        const wasPressed = buttonStates[index];
        // Detect rising edge (button just pressed)
        if (isPressed && !wasPressed) {
            // Reset sequence if too much time has passed
            if (currentTime - lastInputTime > KONAMI_TIMEOUT) {
                sequence.length = 0;
            }
            lastInputTime = currentTime;
            // Add key to sequence
            sequence.push(konamiKey);
            // Keep only the last 10 keys
            if (sequence.length > KONAMI_CODE.length) {
                sequence.shift();
            }
            // Check if sequence matches Konami code
            if (sequence.length === KONAMI_CODE.length) {
                const matches = sequence.every((key, idx) => key === KONAMI_CODE[idx]);
                if (matches) {
                    activated = true;
                    sequence.length = 0; // Reset sequence
                }
            }
        }
        buttonStates[index] = isPressed;
    }
    return { sequence, lastInputTime, activated };
}
function updateCameraWithGamepad(camera, gamepad, elapsed) {
    // Determine which player this is
    const animController = camera === cameraLeft ? leftPlayerAnimController : rightPlayerAnimController;
    const isLeftPlayer = camera === cameraLeft;
    // Check for Konami code input (only during gameplay)
    if (gameState === GameState.PLAYING) {
        if (isLeftPlayer) {
            const result = checkGamepadKonamiCode(gamepad, leftGamepadKonamiSequence, lastLeftGamepadKonamiInputTime, leftGamepadButtonStates);
            leftGamepadKonamiSequence = result.sequence;
            lastLeftGamepadKonamiInputTime = result.lastInputTime;
            if (result.activated) {
                leftPlayerGodMode = !leftPlayerGodMode;
                console.log(`Left player god mode: ${leftPlayerGodMode ? 'ACTIVATED' : 'DEACTIVATED'}`);
                if (leftPlayerGodMode) {
                    document.body.style.transition = 'background-color 0.3s';
                    document.body.style.backgroundColor = 'gold';
                    setTimeout(() => {
                        document.body.style.backgroundColor = '';
                    }, 300);
                }
            }
        }
        else {
            const result = checkGamepadKonamiCode(gamepad, rightGamepadKonamiSequence, lastRightGamepadKonamiInputTime, rightGamepadButtonStates);
            rightGamepadKonamiSequence = result.sequence;
            lastRightGamepadKonamiInputTime = result.lastInputTime;
            if (result.activated) {
                rightPlayerGodMode = !rightPlayerGodMode;
                console.log(`Right player god mode: ${rightPlayerGodMode ? 'ACTIVATED' : 'DEACTIVATED'}`);
                if (rightPlayerGodMode) {
                    document.body.style.transition = 'background-color 0.3s';
                    document.body.style.backgroundColor = 'gold';
                    setTimeout(() => {
                        document.body.style.backgroundColor = '';
                    }, 300);
                }
            }
        }
    }
    // Handle start button (button 9) for game start
    if (gameState === GameState.WAITING_FOR_START) {
        const startPressed = gamepad.buttons[9]?.pressed || false;
        // Handle D-pad for color selection (only before readying up)
        const dpadUp = gamepad.buttons[12]?.pressed || false;
        const dpadDown = gamepad.buttons[13]?.pressed || false;
        if (isLeftPlayer) {
            // Color selection with D-pad
            if (!leftPlayerReady) {
                if (dpadUp && !leftDPadUpPressed) {
                    leftPlayerColorIndex = (leftPlayerColorIndex - 1 + PLAYER_COLORS.length) % PLAYER_COLORS.length;
                    const colorRGB = PLAYER_COLORS[leftPlayerColorIndex].rgb;
                    const colorStyle = `rgb(${Math.round(colorRGB.x * 255)}, ${Math.round(colorRGB.y * 255)}, ${Math.round(colorRGB.z * 255)})`;
                    leftColorSelectDiv.innerHTML = `Color: <span style="color: ${colorStyle};">${PLAYER_COLORS[leftPlayerColorIndex].name}</span><br><span style="font-size: 16px;">D-Pad Up/Down to change</span>`;
                }
                if (dpadDown && !leftDPadDownPressed) {
                    leftPlayerColorIndex = (leftPlayerColorIndex + 1) % PLAYER_COLORS.length;
                    const colorRGB = PLAYER_COLORS[leftPlayerColorIndex].rgb;
                    const colorStyle = `rgb(${Math.round(colorRGB.x * 255)}, ${Math.round(colorRGB.y * 255)}, ${Math.round(colorRGB.z * 255)})`;
                    leftColorSelectDiv.innerHTML = `Color: <span style="color: ${colorStyle};">${PLAYER_COLORS[leftPlayerColorIndex].name}</span><br><span style="font-size: 16px;">D-Pad Up/Down to change</span>`;
                }
            }
            // Always update button state tracking
            leftDPadUpPressed = dpadUp;
            leftDPadDownPressed = dpadDown;
            // Ready up with start button
            if (startPressed && !leftStartButtonPressed && !leftPlayerReady) {
                leftPlayerReady = true;
                leftStartMessageDiv.innerHTML = 'Ready! Waiting for other player...';
                leftStartMessageDiv.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
                leftColorSelectDiv.style.display = 'none'; // Hide color selector
                checkBothPlayersReady();
            }
            leftStartButtonPressed = startPressed;
        }
        else {
            // Color selection with D-pad
            if (!rightPlayerReady) {
                if (dpadUp && !rightDPadUpPressed) {
                    rightPlayerColorIndex = (rightPlayerColorIndex - 1 + PLAYER_COLORS.length) % PLAYER_COLORS.length;
                    const colorRGB = PLAYER_COLORS[rightPlayerColorIndex].rgb;
                    const colorStyle = `rgb(${Math.round(colorRGB.x * 255)}, ${Math.round(colorRGB.y * 255)}, ${Math.round(colorRGB.z * 255)})`;
                    rightColorSelectDiv.innerHTML = `Color: <span style="color: ${colorStyle};">${PLAYER_COLORS[rightPlayerColorIndex].name}</span><br><span style="font-size: 16px;">D-Pad Up/Down to change</span>`;
                }
                if (dpadDown && !rightDPadDownPressed) {
                    rightPlayerColorIndex = (rightPlayerColorIndex + 1) % PLAYER_COLORS.length;
                    const colorRGB = PLAYER_COLORS[rightPlayerColorIndex].rgb;
                    const colorStyle = `rgb(${Math.round(colorRGB.x * 255)}, ${Math.round(colorRGB.y * 255)}, ${Math.round(colorRGB.z * 255)})`;
                    rightColorSelectDiv.innerHTML = `Color: <span style="color: ${colorStyle};">${PLAYER_COLORS[rightPlayerColorIndex].name}</span><br><span style="font-size: 16px;">D-Pad Up/Down to change</span>`;
                }
            }
            // Always update button state tracking
            rightDPadUpPressed = dpadUp;
            rightDPadDownPressed = dpadDown;
            // Ready up with start button
            if (startPressed && !rightStartButtonPressed && !rightPlayerReady) {
                rightPlayerReady = true;
                rightStartMessageDiv.innerHTML = 'Ready! Waiting for other player...';
                rightStartMessageDiv.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
                rightColorSelectDiv.style.display = 'none'; // Hide color selector
                checkBothPlayersReady();
            }
            rightStartButtonPressed = startPressed;
        }
    }
    // Check for start button to exit god mode (during gameplay)
    if (gameState === GameState.PLAYING) {
        const startPressed = gamepad.buttons[9]?.pressed || false;
        if (isLeftPlayer) {
            // Check for respawn if dead
            if (startPressed && !leftStartButtonPressed && leftPlayerDead) {
                respawnPlayer(true);
            }
            // Check for god mode exit if alive
            else if (startPressed && !leftStartButtonPressed && leftPlayerGodMode && !leftPlayerDead) {
                leftPlayerGodMode = false;
                console.log('Left player god mode: DEACTIVATED');
            }
            leftStartButtonPressed = startPressed;
        }
        else {
            // Check for respawn if dead
            if (startPressed && !rightStartButtonPressed && rightPlayerDead) {
                respawnPlayer(false);
            }
            // Check for god mode exit if alive
            else if (startPressed && !rightStartButtonPressed && rightPlayerGodMode && !rightPlayerDead) {
                rightPlayerGodMode = false;
                console.log('Right player god mode: DEACTIVATED');
            }
            rightStartButtonPressed = startPressed;
        }
    }
    // Don't process movement during countdown
    if (gameState === GameState.COUNTDOWN) {
        return;
    }
    // Don't allow movement if player is dead
    if ((isLeftPlayer && leftPlayerDead) || (!isLeftPlayer && rightPlayerDead)) {
        return;
    }
    // B button (button 1) for sprint
    const isSprinting = gamepad.buttons[1]?.pressed || false;
    const baseSpeed = 0.20;
    const currentSpeed = isSprinting ? baseSpeed * sprintMultiplier : baseSpeed;
    // A button (button 0) for jump
    if (gamepad.buttons[0]?.pressed) {
        camera.jump();
    }
    // Combat animations
    // Left trigger (button 4) - left punch
    if (gamepad.buttons[4]?.pressed) {
        animController.requestAnimation(AnimationState.LEFT_PUNCH);
    }
    // Right trigger (button 5) - right punch
    if (gamepad.buttons[5]?.pressed) {
        animController.requestAnimation(AnimationState.RIGHT_PUNCH);
    }
    // Left bumper (button 6) - left kick
    if (gamepad.buttons[6]?.pressed) {
        animController.requestAnimation(AnimationState.LEFT_KICK);
    }
    // Right bumper (button 7) - right kick
    if (gamepad.buttons[7]?.pressed) {
        animController.requestAnimation(AnimationState.RIGHT_KICK);
    }
    // D-pad animations (only during gameplay, not during color selection)
    if (gameState === GameState.PLAYING) {
        // D-pad up (button 12) - wilky
        if (gamepad.buttons[12]?.pressed) {
            animController.requestAnimation(AnimationState.WILKY);
        }
        // D-pad left (button 14) - frat flick
        if (gamepad.buttons[14]?.pressed) {
            animController.requestAnimation(AnimationState.FRAT_FLICK);
        }
        // D-pad right (button 15) - cam ward
        if (gamepad.buttons[15]?.pressed) {
            animController.requestAnimation(AnimationState.CAM_WARD);
        }
        // D-pad down (button 13) - wave 1
        if (gamepad.buttons[13]?.pressed) {
            animController.requestAnimation(AnimationState.WAVE_1);
        }
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
    // Determine if player is moving
    const isMoving = inputForward !== 0 || inputStrafe !== 0;
    // Request walk animation when moving, idle when not (if not jumping)
    if (!camera.isJumping) {
        if (isMoving) {
            animController.requestAnimation(AnimationState.WALK);
        }
        else {
            animController.requestAnimation(AnimationState.IDLE);
        }
    }
    // Update momentum based on input
    camera.updateMomentum(inputForward, inputStrafe);
    // Apply movement with momentum
    camera.applyMomentumMovement(elapsed * currentSpeed);
    // Clamp camera position to terrain boundaries
    clampCameraToTerrain(camera);
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
    currentLightTime = lightTime; // Update global for use in render
    // Update FPS counter
    fpsCounter.update(now);
    // Orbit the sun around the diamond position
    const lightPosX = diamondPosition.x + sunOrbitRadius * Math.sin(lightTime);
    const lightPosZ = diamondPosition.z + sunOrbitRadius * Math.cos(lightTime);
    lightPosition = new Vector3(lightPosX, sunHeight, lightPosZ);
    // Rotate diamond
    diamondRotation += elapsed * 0.1; // Rotate slowly
    // Update tower light bobbing animation
    towerLightBobOffset = Math.sin(lightTime * 0.3) * 1; // Bob up and down 1 unit slowly
    // Update animation controllers
    leftPlayerAnimController.update(elapsed);
    rightPlayerAnimController.update(elapsed);
    // Update jump animations for both players
    leftPlayerAnimController.updateJumpAnimation(cameraLeft);
    rightPlayerAnimController.updateJumpAnimation(cameraRight);
    // Tick both models with elapsed time (independent animations)
    modelLeft.tick(elapsed);
    modelRight.tick(elapsed);
    // Update game state (handles countdown)
    updateGameState(elapsed);
    // Update stopwatch display
    updateStopwatch();
    updateCamera(elapsed);
    // Update physics, knockback, and combat (but not during countdown)
    if (gameState !== GameState.COUNTDOWN) {
        // Sync god mode state to cameras
        cameraLeft.godMode = leftPlayerGodMode;
        cameraRight.godMode = rightPlayerGodMode;
        // Update knockback for both players BEFORE physics
        // This ensures knockback movement happens before gravity/landing checks
        cameraLeft.updateKnockback();
        cameraRight.updateKnockback();
        // Clamp cameras to terrain after knockback to prevent wall clipping
        clampCameraToTerrain(cameraLeft);
        clampCameraToTerrain(cameraRight);
        // Update physics for both cameras (handles jumping and falling)
        cameraLeft.updatePhysics(elapsed);
        cameraRight.updatePhysics(elapsed);
        // Check for player-on-player hits
        checkPlayerHit();
        // Check for diamond collision (win condition)
        checkDiamondCollision();
    }
    // Check for rematch button presses when game is won
    checkRematchButtons();
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
    // Update compasses
    updateCompass(cameraLeft, compassLeftDiv);
    updateCompass(cameraRight, compassRightDiv);
    // Update altimeters
    updateAltimeter(cameraLeft, altimeterLeftDiv);
    updateAltimeter(cameraRight, altimeterRightDiv);
    // Keep god mode players at full health
    if (leftPlayerGodMode) {
        leftPlayerHealth = MAX_HEALTH;
    }
    if (rightPlayerGodMode) {
        rightPlayerHealth = MAX_HEALTH;
    }
    // Update health bars
    updateHealthBars();
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
    // Pass the three matrices as separate uniforms (set once for scene)
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromModel.elements);
    // Transform light position from world space to eye space (calculate once per scene)
    const lightPositionEye = camera.eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram.setUniform3f('lightPositionEye', lightPositionEye.x, lightPositionEye.y, lightPositionEye.z);
    shaderProgram.setUniform1f('ambientFactor', 0.3);
    //set diffuse to yellow
    shaderProgram.setUniform3f('diffuseColor', 1.0, 1.0, 0.82);
    shaderProgram.setUniform3f('specularColor', 0, 0, 0);
    shaderProgram.setUniform1f('shininess', 32.0);
    shaderProgram.setUniform1i('playerTexture', 0);
    shaderProgram.setUniform1i('usePlatformTexture', 0);
    // Bind grass texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0);
    if (grassTexture) {
        gl.bindTexture(gl.TEXTURE_2D, grassTexture);
    }
    else {
        // If texture is missing, ensure unit 0 is unbound
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    vaoGltf.bind();
    vaoGltf.drawIndexed(gl.TRIANGLES);
    vaoGltf.unbind();
    // Render all platforms (keep shader bound to reduce state changes)
    for (const platform of platforms) {
        renderPlatform(platform);
    }
    // Render towers - 4 towers at terrain corners
    const terrainHalfWidth = terrainCenterX;
    const terrainHalfDepth = terrainCenterZ;
    // Black color for towers
    const blackColor = new Vector3(0.1, 0.1, 0.1);
    // Northeast tower
    renderTower(new Vector3(terrainCenterX + terrainHalfWidth, 0, terrainCenterZ + terrainHalfDepth), Matrix4.rotateY(170), 10, blackColor);
    // Northwest tower
    renderTower(new Vector3(terrainCenterX - terrainHalfWidth, 0, terrainCenterZ + terrainHalfDepth), Matrix4.rotateY(260), 10, blackColor);
    // Southeast tower
    renderTower(new Vector3(terrainCenterX + terrainHalfWidth, 0, terrainCenterZ - terrainHalfDepth), Matrix4.rotateY(80), 10, blackColor);
    // Southwest tower
    renderTower(new Vector3(terrainCenterX - terrainHalfWidth, 0, terrainCenterZ - terrainHalfDepth), Matrix4.rotateY(-10), 10, blackColor);
    // Render walls connecting the towers on the four edges
    const wallScaleX = terrainHalfWidth / 47.5; // Scale to span terrain width (wall model is ~100 units wide at scale 1)
    const wallScaleZ = terrainHalfDepth / 47.5; // Scale to span terrain depth
    // North wall (positive Z edge - aligned with terrain)
    renderWall(new Vector3(terrainCenterX + 745, 0, terrainCenterZ + terrainHalfDepth), Matrix4.rotateY(180), wallScaleX, 10, 10, blackColor);
    // East wall (positive X edge - aligned with terrain)
    renderWall(new Vector3(terrainCenterX + terrainHalfWidth, 0, terrainCenterZ - 750), Matrix4.rotateY(90), wallScaleZ, 10, 10, blackColor);
    // South wall (negative Z edge - aligned with terrain)
    renderWall(new Vector3(terrainCenterX + 750, 0, terrainCenterZ - terrainHalfDepth), Matrix4.rotateY(180), wallScaleX, 10, 10, blackColor);
    // West wall (negative X edge - aligned with terrain)
    renderWall(new Vector3(terrainCenterX - terrainHalfWidth, 0, terrainCenterZ - 750), Matrix4.rotateY(90), wallScaleZ, 10, 10, blackColor);
    shaderProgram.unbind();
    // Render player models (rebind shader for player-specific settings)
    shaderProgram.bind();
    shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    shaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
    const lightPositionEyePlayer = camera.eyeFromWorld.multiplyPosition(lightPosition);
    shaderProgram.setUniform3f('lightPositionEye', lightPositionEyePlayer.x, lightPositionEyePlayer.y, lightPositionEyePlayer.z);
    shaderProgram.setUniform1f('ambientFactor', 0.3);
    shaderProgram.setUniform1i('playerTexture', 1);
    // Only render players if they're alive
    if (!leftPlayerDead) {
        renderPlayer(cameraLeft, playerLeftVao, PLAYER_COLORS[leftPlayerColorIndex].rgb);
    }
    if (!rightPlayerDead) {
        renderPlayer(cameraRight, playerRightVao, PLAYER_COLORS[rightPlayerColorIndex].rgb);
    }
    shaderProgram.setUniform1i('playerTexture', 0);
    // Restore normal ambient factor after player rendering
    shaderProgram.setUniform1f('ambientFactor', 0.5);
    shaderProgram.unbind();
    // Render the sun after terrain
    sunShaderProgram.bind();
    // Sun rendering disabled - keeping only the light source for diamond illumination
    // // Create transformation matrix for the sun
    // const worldFromSun = Matrix4.translate(lightPosition.x, lightPosition.y, lightPosition.z);
    // // Upload transformation matrices for the sun
    // sunShaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
    // sunShaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
    // sunShaderProgram.setUniformMatrix4fv('worldFromModel', worldFromSun.elements);
    // sunShaderProgram.setUniform3f('lightColor', 1.0, 0.9, 0.2); // Bright yellow/orange sun
    // sunVao.bind();
    // sunVao.drawIndexed(gl.TRIANGLES);
    // sunVao.unbind();
    // Render stationary tower lights with fire animation (keep shader bound)
    for (let i = 0; i < towerLightPositions.length; i++) {
        const towerLightPos = towerLightPositions[i];
        // Create unique flickering for each light using different time offsets
        const timeOffset = i * 1.5;
        const flickerSpeed = 8;
        const flicker1 = Math.sin(currentLightTime * flickerSpeed + timeOffset);
        const flicker2 = Math.sin(currentLightTime * flickerSpeed * 1.3 + timeOffset + 0.5);
        const flicker3 = Math.cos(currentLightTime * flickerSpeed * 0.7 + timeOffset + 1.0);
        // Create fire colors that shift between yellow, orange, and red
        const colorMix = (flicker1 + 1) * 0.5; // 0 to 1
        const colorMix2 = (flicker2 + 1) * 0.5;
        // Blend between yellow (1,1,0.3), orange (1,0.5,0), and red (1,0.2,0)
        const red = 1.0;
        const green = 0.3 + colorMix * 0.5 + colorMix2 * 0.2; // Flickers between 0.3 and 1.0
        const blue = colorMix2 * 0.15; // Slight blue component for realism
        // Scale variation for flame effect (pulsing)
        const scaleFlicker = 5 + flicker3 * 0.5; // 4.5 to 5.5 range
        const worldFromTowerLight = Matrix4.translate(towerLightPos.x, towerLightPos.y + towerLightBobOffset, // Add bobbing offset
        towerLightPos.z).multiplyMatrix(Matrix4.scale(scaleFlicker, scaleFlicker * 1.2, scaleFlicker)); // Elongated vertically like flame
        // Use sun shader with dynamic fire colors
        sunShaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
        sunShaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
        sunShaderProgram.setUniformMatrix4fv('worldFromModel', worldFromTowerLight.elements);
        sunShaderProgram.setUniform3f('lightColor', red, green, blue); // Dynamic fire colors
        sunVao.bind();
        sunVao.drawIndexed(gl.TRIANGLES);
        sunVao.unbind();
    }
    sunShaderProgram.unbind();
    // Render spinning diamond end marker (only if visible)
    if (diamondVisible) {
        shaderProgram.bind();
        // Create transformation: translate, rotate (spin), and scale
        const worldFromDiamond = Matrix4.translate(diamondPosition.x, diamondPosition.y, diamondPosition.z).multiplyMatrix(Matrix4.rotateY(diamondRotation))
            .multiplyMatrix(Matrix4.scale(20, 20, 20));
        shaderProgram.setUniformMatrix4fv('clipFromEye', clipFromEye.elements);
        shaderProgram.setUniformMatrix4fv('eyeFromWorld', camera.eyeFromWorld.elements);
        shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromDiamond.elements);
        const lightPositionEyeDiamond = camera.eyeFromWorld.multiplyPosition(lightPosition);
        shaderProgram.setUniform3f('lightPositionEye', lightPositionEyeDiamond.x, lightPositionEyeDiamond.y, lightPositionEyeDiamond.z);
        shaderProgram.setUniform1f('ambientFactor', 0.5);
        shaderProgram.setUniform3f('albedo', 0.0, 0.8, 0.0); // Green color
        shaderProgram.setUniform3f('specularColor', 0.5, 0.5, 0.5);
        shaderProgram.setUniform1f('shininess', 64.0);
        shaderProgram.setUniform1i('playerTexture', 1);
        diamondVao.bind();
        diamondVao.drawIndexed(gl.TRIANGLES);
        diamondVao.unbind();
        shaderProgram.unbind();
    }
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
function renderPlatform(platform) {
    // Create transformation using platform's stored properties: translate, rotate, and scale
    let scaleMatrix;
    // Check if scale is a Vector3 or number
    if (typeof platform.scale === 'number') {
        scaleMatrix = Matrix4.scale(platform.scale, platform.scale, platform.scale);
    }
    else {
        scaleMatrix = Matrix4.scale(platform.scale.x, platform.scale.y, platform.scale.z);
    }
    const worldFromPlatform = Matrix4.translate(platform.position.x, platform.position.y, platform.position.z).multiplyMatrix(platform.rotation)
        .multiplyMatrix(scaleMatrix);
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromPlatform.elements);
    shaderProgram.setUniform3f('specularColor', 0.2, 0.2, 0.2);
    shaderProgram.setUniform1f('shininess', 32.0);
    shaderProgram.setUniform3f('albedo', 1.0, 1.0, 1.0); // White to show texture properly
    shaderProgram.setUniform1f('ambientFactor', 0.6); // Higher ambient for better visibility
    shaderProgram.setUniform1i('playerTexture', 0); // Use texture instead of albedo color
    shaderProgram.setUniform1i('usePlatformTexture', 1); // Use platform texture
    // Bind platform texture to texture unit 2
    gl.activeTexture(gl.TEXTURE2);
    if (platformTexture) {
        gl.bindTexture(gl.TEXTURE_2D, platformTexture);
    }
    platform.vao.bind();
    platform.vao.drawIndexed(gl.TRIANGLES);
    platform.vao.unbind();
}
function renderPlayer(playerCamera, playerVao, color) {
    // Determine which model to use based on camera
    const playerModel = playerCamera === cameraLeft ? modelLeft : modelRight;
    // Check if this player is in god mode
    const isGodMode = playerCamera.godMode;
    // Position character offset from camera - only use horizontal position, ignore pitch
    const offsetRight = 0; // Offset to the right
    const offsetUp = -25; // Negative value moves model down, placing camera at head level
    const offsetForward = -12; // Offset forward from camera
    // Calculate horizontal forward direction (ignore pitch - project to XZ plane)
    const horizontalForward = new Vector3(playerCamera.forward.x, 0, // Zero out Y component to ignore pitch
    playerCamera.forward.z).normalize();
    const cameraRight = playerCamera.right;
    // Use world up for the model's up direction (not camera's up)
    const worldUp = new Vector3(0, 1, 0);
    // Build the character's position - use camera position but ignore pitch effects
    const modelPosition = new Vector3(playerCamera.from.x + horizontalForward.x * offsetForward + cameraRight.x * offsetRight, playerCamera.from.y + offsetUp, // Use camera's Y position with offset
    playerCamera.from.z + horizontalForward.z * offsetForward + cameraRight.z * offsetRight);
    // Build orientation matrix using only yaw (horizontal rotation)
    // Use horizontal forward for Z axis, world up for Y axis
    const orientation = Matrix4.identity();
    // Right vector (X axis) - cross product of world up and horizontal forward
    const orientationRight = worldUp.cross(horizontalForward).normalize();
    orientation.set(0, 0, orientationRight.x);
    orientation.set(1, 0, orientationRight.y);
    orientation.set(2, 0, orientationRight.z);
    // Up vector (Y axis) - always world up
    orientation.set(0, 1, worldUp.x);
    orientation.set(1, 1, worldUp.y);
    orientation.set(2, 1, worldUp.z);
    // Forward vector (Z axis) - horizontal forward
    orientation.set(0, 2, horizontalForward.x);
    orientation.set(1, 2, horizontalForward.y);
    orientation.set(2, 2, horizontalForward.z);
    // If in god mode, render glow aura first (slightly larger, semi-transparent)
    if (isGodMode) {
        // Enable blending for glow effect
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // Additive blending for glow
        gl.depthMask(false); // Don't write to depth buffer for glow
        // Render multiple glow layers for softer effect
        for (let i = 0; i < 3; i++) {
            const glowScale = 0.52 + i * 0.02; // Gradually larger glow layers
            const glowAlpha = 0.4 - i * 0.1; // Fade out outer layers
            const worldFromGlow = Matrix4.translate(modelPosition.x, modelPosition.y, modelPosition.z).multiplyMatrix(orientation)
                .multiplyMatrix(Matrix4.rotateY(0))
                .multiplyMatrix(Matrix4.scale(glowScale, glowScale, glowScale));
            shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromGlow.elements);
            // Upload bone matrices
            for (let [j, matrix] of playerModel.skinTransforms(100).entries()) {
                shaderProgram.setUniformMatrix4fv(`jointTransforms[${j}]`, matrix.elements);
            }
            // Bright glowing color with high ambient
            shaderProgram.setUniform1f('ambientFactor', 1.0);
            const glowColor = color.multiplyScalar(2.0 * glowAlpha);
            shaderProgram.setUniform3f('albedo', glowColor.x, glowColor.y, glowColor.z);
            shaderProgram.setUniform3f('specularColor', 0.0, 0.0, 0.0); // No specular on glow
            shaderProgram.setUniform1f('shininess', 1.0);
            playerVao.bind();
            playerVao.drawIndexed(gl.TRIANGLES);
            playerVao.unbind();
        }
        // Restore rendering state
        gl.disable(gl.BLEND);
        gl.depthMask(true);
    }
    // Render the actual player model
    const worldFromPlayer = Matrix4.translate(modelPosition.x, modelPosition.y, modelPosition.z).multiplyMatrix(orientation)
        .multiplyMatrix(Matrix4.rotateY(0))
        .multiplyMatrix(Matrix4.scale(0.5, 0.5, 0.5));
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromPlayer.elements);
    // Upload bone matrices for skinning using the appropriate model
    for (let [i, matrix] of playerModel.skinTransforms(100).entries()) {
        shaderProgram.setUniformMatrix4fv(`jointTransforms[${i}]`, matrix.elements);
    }
    // Apply normal or slightly enhanced rendering for god mode
    if (isGodMode) {
        shaderProgram.setUniform1f('ambientFactor', 0.5);
        const brightColor = color.multiplyScalar(1.2);
        shaderProgram.setUniform3f('albedo', brightColor.x, brightColor.y, brightColor.z);
        shaderProgram.setUniform3f('specularColor', 0.7, 0.7, 0.7);
        shaderProgram.setUniform1f('shininess', 80.0);
    }
    else {
        shaderProgram.setUniform1f('ambientFactor', 0.3);
        shaderProgram.setUniform3f('albedo', color.x, color.y, color.z);
        shaderProgram.setUniform3f('specularColor', 0.5, 0.5, 0.5);
        shaderProgram.setUniform1f('shininess', 50.0);
    }
    playerVao.bind();
    playerVao.drawIndexed(gl.TRIANGLES);
    playerVao.unbind();
}
function renderTower(position, rotation, scale, color = new Vector3(0.6, 0.6, 0.7)) {
    const worldFromTower = Matrix4.translate(position.x, position.y, position.z).multiplyMatrix(rotation)
        .multiplyMatrix(Matrix4.scale(scale, scale, scale));
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromTower.elements);
    shaderProgram.setUniform3f('specularColor', 0.3, 0.3, 0.3);
    shaderProgram.setUniform1f('shininess', 32.0);
    shaderProgram.setUniform3f('albedo', color.x, color.y, color.z);
    shaderProgram.setUniform1i('playerTexture', 1);
    towerVao.bind();
    towerVao.drawIndexed(gl.TRIANGLES);
    towerVao.unbind();
    shaderProgram.setUniform1i('playerTexture', 0);
}
function renderWall(position, rotation, scaleX, scaleY, scaleZ, color = new Vector3(0.6, 0.6, 0.7)) {
    const worldFromWall = Matrix4.translate(position.x, position.y, position.z).multiplyMatrix(rotation)
        .multiplyMatrix(Matrix4.scale(scaleX, scaleY, scaleZ));
    shaderProgram.setUniformMatrix4fv('worldFromModel', worldFromWall.elements);
    shaderProgram.setUniform3f('specularColor', 0.3, 0.3, 0.3);
    shaderProgram.setUniform1f('shininess', 32.0);
    shaderProgram.setUniform3f('albedo', color.x, color.y, color.z);
    shaderProgram.setUniform1i('playerTexture', 1);
    wallVao.bind();
    wallVao.drawIndexed(gl.TRIANGLES);
    wallVao.unbind();
    shaderProgram.setUniform1i('playerTexture', 0);
}
// ===== PLAYER COMBAT SYSTEM =====
function checkPlayerHit() {
    // Don't process combat if game hasn't started or either player is dead
    if (gameState !== GameState.PLAYING || leftPlayerDead || rightPlayerDead) {
        return;
    }
    const currentTime = Date.now();
    // Calculate player positions (same logic as rendering)
    const offsetForward = -12;
    const offsetUp = -25;
    // Left player position
    const leftHorizontalForward = new Vector3(cameraLeft.forward.x, 0, cameraLeft.forward.z).normalize();
    const leftPlayerPos = new Vector3(cameraLeft.from.x + leftHorizontalForward.x * offsetForward, cameraLeft.from.y + offsetUp, cameraLeft.from.z + leftHorizontalForward.z * offsetForward);
    // Right player position
    const rightHorizontalForward = new Vector3(cameraRight.forward.x, 0, cameraRight.forward.z).normalize();
    const rightPlayerPos = new Vector3(cameraRight.from.x + rightHorizontalForward.x * offsetForward, cameraRight.from.y + offsetUp, cameraRight.from.z + rightHorizontalForward.z * offsetForward);
    // Calculate distance between players
    const distance = leftPlayerPos.subtract(rightPlayerPos).magnitude;
    const hitRange = 50; // Maximum range for a hit to connect
    // Check if left player is attacking and in range
    if (leftPlayerAnimController.isAttacking() && distance < hitRange && currentTime - leftPlayerLastHitTime > HIT_COOLDOWN) {
        // Skip if target is in god mode
        if (!rightPlayerGodMode) {
            // Determine damage based on attack type
            const currentAnim = leftPlayerAnimController.getCurrentAnimation();
            let damage = PUNCH_DAMAGE;
            if (currentAnim === AnimationState.LEFT_KICK || currentAnim === AnimationState.RIGHT_KICK) {
                damage = KICK_DAMAGE;
            }
            // Apply god mode multiplier
            if (leftPlayerGodMode) {
                damage *= 10;
            }
            // Deal damage to right player
            rightPlayerHealth = Math.max(0, rightPlayerHealth - damage);
            leftPlayerLastHitTime = currentTime;
            // Check for death
            if (rightPlayerHealth <= 0) {
                rightPlayerDead = true;
                rightDeathScreenDiv.style.display = 'block';
            }
        }
        // Calculate knockback direction (from left player to right player)
        const horizontalDir = rightPlayerPos.subtract(leftPlayerPos);
        horizontalDir.y = 0; // Zero out Y to get pure horizontal direction
        const knockbackDir = horizontalDir.normalize();
        // Add upward component to ensure player leaves the ground
        const knockbackVector = new Vector3(knockbackDir.x, 0.3, knockbackDir.z);
        const baseKnockbackStrength = 15; // Base knockback distance
        const knockbackStrength = leftPlayerGodMode ? baseKnockbackStrength * 10 : baseKnockbackStrength;
        // Apply knockback to right player
        cameraRight.applyKnockback(knockbackVector, knockbackStrength);
    }
    // Check if right player is attacking and in range
    if (rightPlayerAnimController.isAttacking() && distance < hitRange && currentTime - rightPlayerLastHitTime > HIT_COOLDOWN) {
        // Skip if target is in god mode
        if (!leftPlayerGodMode) {
            // Determine damage based on attack type
            const currentAnim = rightPlayerAnimController.getCurrentAnimation();
            let damage = PUNCH_DAMAGE;
            if (currentAnim === AnimationState.LEFT_KICK || currentAnim === AnimationState.RIGHT_KICK) {
                damage = KICK_DAMAGE;
            }
            // Apply god mode multiplier
            if (rightPlayerGodMode) {
                damage *= 10;
            }
            // Deal damage to left player
            leftPlayerHealth = Math.max(0, leftPlayerHealth - damage);
            rightPlayerLastHitTime = currentTime;
            // Check for death
            if (leftPlayerHealth <= 0) {
                leftPlayerDead = true;
                leftDeathScreenDiv.style.display = 'block';
            }
        }
        // Calculate knockback direction (from right player to left player)
        const horizontalDir = leftPlayerPos.subtract(rightPlayerPos);
        horizontalDir.y = 0; // Zero out Y to get pure horizontal direction
        const knockbackDir = horizontalDir.normalize();
        // Add upward component to ensure player leaves the ground
        const knockbackVector = new Vector3(knockbackDir.x, 0.3, knockbackDir.z);
        const baseKnockbackStrength = 15;
        const knockbackStrength = rightPlayerGodMode ? baseKnockbackStrength * 10 : baseKnockbackStrength;
        // Apply knockback to left player
        cameraLeft.applyKnockback(knockbackVector, knockbackStrength);
    }
}
// ===== END PLAYER COMBAT SYSTEM =====
function updateHealthBars() {
    // Update left player health bar
    const leftHealthPercent = (leftPlayerHealth / MAX_HEALTH) * 100;
    let leftColor = 'rgb(0, 255, 0)'; // Green
    if (leftHealthPercent <= 25) {
        leftColor = 'rgb(255, 0, 0)'; // Red
    }
    else if (leftHealthPercent <= 50) {
        leftColor = 'rgb(255, 255, 0)'; // Yellow
    }
    const leftWidth = (leftHealthPercent / 100) * 110; // 110px is full width
    healthBarLeftDiv.innerHTML = `<div style="width: ${leftWidth}px; height: 100%; background-color: ${leftColor}; transition: width 0.3s, background-color 0.3s; margin-left: auto;"></div>`;
    // Update right player health bar
    const rightHealthPercent = (rightPlayerHealth / MAX_HEALTH) * 100;
    let rightColor = 'rgb(0, 255, 0)'; // Green
    if (rightHealthPercent <= 25) {
        rightColor = 'rgb(255, 0, 0)'; // Red
    }
    else if (rightHealthPercent <= 50) {
        rightColor = 'rgb(255, 255, 0)'; // Yellow
    }
    const rightWidth = (rightHealthPercent / 100) * 110; // 110px is full width
    healthBarRightDiv.innerHTML = `<div style="width: ${rightWidth}px; height: 100%; background-color: ${rightColor}; transition: width 0.3s, background-color 0.3s; margin-left: auto;"></div>`;
}
function respawnPlayer(isLeftPlayer) {
    if (isLeftPlayer) {
        leftPlayerDead = false;
        leftPlayerHealth = MAX_HEALTH;
        leftDeathScreenDiv.style.display = 'none';
        // Reset position to spawn
        cameraLeft.from = new Vector3(terrainCenterX - 100, 200, terrainCenterZ);
        cameraLeft.verticalVelocity = 0;
        cameraLeft.isJumping = true;
        cameraLeft.reorient();
    }
    else {
        rightPlayerDead = false;
        rightPlayerHealth = MAX_HEALTH;
        rightDeathScreenDiv.style.display = 'none';
        // Reset position to spawn
        cameraRight.from = new Vector3(terrainCenterX + 100, 200, terrainCenterZ);
        cameraRight.verticalVelocity = 0;
        cameraRight.isJumping = true;
        cameraRight.reorient();
    }
}
function updateCompass(camera, compassDiv) {
    // Calculate heading from camera's forward vector
    const forward = camera.forward;
    let heading = Math.atan2(forward.x, forward.z) * 180 / Math.PI;
    // Normalize to 0-360 range
    if (heading < 0) {
        heading += 360;
    }
    // Determine cardinal direction
    let direction = '';
    if (heading >= 337.5 || heading < 22.5) {
        direction = 'N';
    }
    else if (heading >= 22.5 && heading < 67.5) {
        direction = 'NE';
    }
    else if (heading >= 67.5 && heading < 112.5) {
        direction = 'E';
    }
    else if (heading >= 112.5 && heading < 157.5) {
        direction = 'SE';
    }
    else if (heading >= 157.5 && heading < 202.5) {
        direction = 'S';
    }
    else if (heading >= 202.5 && heading < 247.5) {
        direction = 'SW';
    }
    else if (heading >= 247.5 && heading < 292.5) {
        direction = 'W';
    }
    else if (heading >= 292.5 && heading < 337.5) {
        direction = 'NW';
    }
    compassDiv.innerHTML = `${direction} ${Math.round(heading)}°`;
}
function updateAltimeter(camera, altimeterDiv) {
    // Get the altitude from the camera's Y position
    // Use the lower starting Y position (approximately 85) as the baseline (ground level = 0ft)
    // Apply a scaling factor to make the final platform at 500ft
    const baselineY = 85; // Ground level reference point
    const scaleFactor = 0.0705; // Scale factor to make diamond platform at 500ft
    const altitude = Math.round((camera.from.y - baselineY) * scaleFactor);
    altimeterDiv.innerHTML = `${altitude}ft`;
}
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // Each half gets its own aspect ratio
    const halfWidth = canvas.clientWidth / 2;
    const aspectRatio = halfWidth / canvas.clientHeight;
    const fovY = 100;
    const near = .1;
    const far = 10000;
    clipFromEyeLeft = Matrix4.perspective(fovY, aspectRatio, near, far);
    clipFromEyeRight = Matrix4.perspective(fovY, aspectRatio, near, far);
    render();
}
window.addEventListener('load', async () => {
    try {
        await initialize();
    }
    catch (error) {
        console.error('Error during initialization:', error);
    }
});
