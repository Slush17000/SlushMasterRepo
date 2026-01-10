import { Matrix4 } from "./matrix.js";
import { Vector3 } from "./vector.js";
import { lerp } from "./math-utilities.js";
export class FirstPersonCamera {
    constructor(from, to, worldUp, field = null, offset = 0, factors = null) {
        this.forward = to.subtract(from).normalize();
        this.from = from;
        this.worldUp = worldUp;
        this.verticalVelocity = 0;
        this.gravity = 0.002; // Gravity acceleration per millisecond squared
        this.isJumping = true; // Start in jumping state so it falls
        this.field = field;
        this.offset = offset;
        this.factors = factors;
        this.meshes = [];
        this.meshInteractionEnabled = true;
        // Initialize momentum
        this.momentumForward = 0;
        this.momentumStrafe = 0;
        this.acceleration = 0.15; // Higher = faster acceleration
        this.deceleration = 0.10; // Higher = faster stopping
        // Initialize knockback
        this.knockbackVelocity = new Vector3(0, 0, 0);
        this.knockbackDecay = 0.85; // Knockback decays to 15% each frame
        // Initialize god mode
        this.godMode = false;
        this.reorient();
    }
    reorient() {
        this.eyeFromWorld = Matrix4.look(this.from, this.forward, this.worldUp);
        this.right = new Vector3(this.eyeFromWorld.get(0, 0), this.eyeFromWorld.get(0, 1), this.eyeFromWorld.get(0, 2));
    }
    strafe(distance) {
        this.from = this.from.add(this.right.multiplyScalar(distance));
        if (this.meshInteractionEnabled) {
            this.checkIfShouldFall();
        }
        this.reorient();
    }
    advance(distance) {
        // In god mode or when mesh interaction is disabled, allow full 3D movement
        if (this.godMode || !this.meshInteractionEnabled) {
            // Use full forward vector for free 3D movement
            this.from = this.from.add(this.forward.multiplyScalar(distance));
        }
        else {
            // Project forward vector onto horizontal plane (XZ plane) by zeroing Y component
            const horizontalForward = new Vector3(this.forward.x, 0, this.forward.z).normalize();
            this.from = this.from.add(horizontalForward.multiplyScalar(distance));
            this.checkIfShouldFall();
        }
        this.reorient();
    }
    yaw(degrees) {
        const rotation = Matrix4.rotateAround(this.worldUp, degrees);
        this.forward = rotation.multiplyVector3(this.forward);
        this.reorient();
    }
    pitch(degrees) {
        const rotation = Matrix4.rotateAround(this.right, degrees);
        this.forward = rotation.multiplyVector3(this.forward);
        this.reorient();
    }
    jump(initialVelocity = 1) {
        // Only allow jumping if on the ground
        if (!this.isJumping) {
            this.verticalVelocity = initialVelocity;
            this.isJumping = true;
        }
    }
    // Update momentum based on input
    updateMomentum(inputForward, inputStrafe) {
        // inputForward and inputStrafe should be -1 to 1 range
        if (inputForward !== 0) {
            // Accelerate towards target
            this.momentumForward = lerp(this.momentumForward, inputForward, this.acceleration);
        }
        else {
            // Decelerate to zero
            this.momentumForward = lerp(this.momentumForward, 0, this.deceleration);
        }
        if (inputStrafe !== 0) {
            // Accelerate towards target
            this.momentumStrafe = lerp(this.momentumStrafe, inputStrafe, this.acceleration);
        }
        else {
            // Decelerate to zero
            this.momentumStrafe = lerp(this.momentumStrafe, 0, this.deceleration);
        }
    }
    // Apply movement with momentum
    applyMomentumMovement(speed) {
        if (Math.abs(this.momentumForward) > 0.001) {
            this.advance(this.momentumForward * speed);
        }
        if (Math.abs(this.momentumStrafe) > 0.001) {
            this.strafe(this.momentumStrafe * speed);
        }
    }
    // Apply knockback to the camera
    applyKnockback(direction, strength) {
        // God mode players don't receive knockback
        if (this.godMode) {
            return;
        }
        // Set knockback velocity in the given direction
        this.knockbackVelocity = direction.multiplyScalar(strength);
        // Enter jumping state so player falls naturally if knocked off platform
        this.isJumping = true;
    }
    // Update knockback physics (call this in update loop)
    updateKnockback() {
        // Apply knockback velocity to position
        if (this.knockbackVelocity.magnitude > 0.1) {
            const newPosition = this.from.add(this.knockbackVelocity);
            // Store the new position (will be clamped by terrain boundaries in the game loop)
            this.from = newPosition;
            this.reorient();
            // Decay knockback velocity
            this.knockbackVelocity = this.knockbackVelocity.multiplyScalar(this.knockbackDecay);
        }
        else {
            // Stop knockback when velocity is negligible
            this.knockbackVelocity = new Vector3(0, 0, 0);
        }
    }
    addMesh(mesh) {
        this.meshes.push(mesh);
    }
    removeMesh(mesh) {
        const index = this.meshes.indexOf(mesh);
        if (index > -1) {
            this.meshes.splice(index, 1);
        }
    }
    clearMeshes() {
        this.meshes = [];
    }
    checkIfShouldFall() {
        // If we're on the ground, check if we're still above ground
        // If not, start falling
        if (!this.isJumping) {
            const groundHeight = this.getGroundHeight();
            if (groundHeight === null) {
                // No ground beneath us - start falling
                this.isJumping = true;
                this.verticalVelocity = 0;
            }
            else if (this.from.y > groundHeight + 0.5) {
                // We're significantly above ground - start falling
                // Increased tolerance to prevent false triggers
                this.isJumping = true;
                this.verticalVelocity = 0;
            }
            else {
                // Snap to ground if we're on it
                this.from.y = groundHeight;
                this.verticalVelocity = 0;
            }
        }
    }
    /**
     * Finds the highest ground surface beneath the camera position.
     * Checks both the terrain heightfield and all collision meshes.
     * @returns The Y coordinate of the ground surface, or null if no ground is found
     * @see https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection
     * @see https://en.wikipedia.org/wiki/Collision_detection#A_posteriori_(discrete)_versus_a_priori_(continuous)
     */
    getGroundHeight() {
        let maxHeight = null;
        // Check terrain if available
        if (this.field && this.factors) {
            const x = this.from.x / this.factors.x;
            const z = this.from.z / this.factors.z;
            const height = this.field.blerp(x, z);
            maxHeight = height * this.factors.y + this.offset;
        }
        // Check all meshes for collision
        for (const mesh of this.meshes) {
            const meshHeight = this.getMeshHeightAt(mesh, this.from.x, this.from.z);
            if (meshHeight !== null) {
                // Add offset to mesh height just like terrain
                const meshHeightWithOffset = meshHeight + this.offset;
                if (maxHeight === null || meshHeightWithOffset > maxHeight) {
                    maxHeight = meshHeightWithOffset;
                }
            }
        }
        return maxHeight;
    }
    /**
     * Finds the lowest ceiling surface above the camera position.
     * Used to detect when the player's head hits an overhead obstacle.
     * @returns The Y coordinate of the ceiling surface, or null if no ceiling is found
     * @see https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection
     * @see https://gamedev.stackexchange.com/questions/18436/most-efficient-aabb-vs-ray-collision-algorithms
     */
    getCeilingHeight() {
        let minHeight = null;
        // Check all meshes for ceiling collision
        for (const mesh of this.meshes) {
            const meshCeiling = this.getMeshCeilingAt(mesh, this.from.x, this.from.z);
            if (meshCeiling !== null) {
                // Subtract offset from ceiling height to account for player head
                const meshCeilingWithOffset = meshCeiling - this.offset;
                if (minHeight === null || meshCeilingWithOffset < minHeight) {
                    minHeight = meshCeilingWithOffset;
                }
            }
        }
        return minHeight;
    }
    intersectRayBox(rayStart, rayDirection, boxMin, boxMax) {
        // Intersect the ray with the left and right planes.
        let t0 = (boxMin.x - rayStart.x) / rayDirection.x;
        let t1 = (boxMax.x - rayStart.x) / rayDirection.x;
        // Swap to keep t0 the smaller of the two.
        if (t0 > t1) {
            const tmp = t0;
            t0 = t1;
            t1 = tmp;
        }
        // Intersect the ray with the bottom and top planes.
        let ty0 = (boxMin.y - rayStart.y) / rayDirection.y;
        let ty1 = (boxMax.y - rayStart.y) / rayDirection.y;
        if (ty0 > ty1) {
            const tmp = ty0;
            ty0 = ty1;
            ty1 = tmp;
        }
        // If we've exited one dimension before starting another, bail.
        if (t0 > ty1 || ty0 > t1)
            return [];
        // Keep greater t*0 and smaller t*1.
        if (ty0 > t0)
            t0 = ty0;
        if (ty1 < t1)
            t1 = ty1;
        // Intersect the ray with the near and far planes.
        let tz0 = (boxMin.z - rayStart.z) / rayDirection.z;
        let tz1 = (boxMax.z - rayStart.z) / rayDirection.z;
        if (tz0 > tz1) {
            const tmp = tz0;
            tz0 = tz1;
            tz1 = tmp;
        }
        // If we've exited one dimension before starting another, bail.
        if (t0 > tz1 || tz0 > t1)
            return [];
        // Keep greater t*0 and smaller t*1.
        if (tz0 > t0)
            t0 = tz0;
        if (tz1 < t1)
            t1 = tz1;
        // Locate two points on ray.
        return [
            rayStart.add(rayDirection.multiplyScalar(t0)),
            rayStart.add(rayDirection.multiplyScalar(t1)),
        ];
    }
    /**
     * Finds the lowest surface above the camera by casting an upward ray.
     * Used for ceiling collision detection (head bumping).
     * @param mesh The mesh to check for ceiling collision
     * @param x Camera X position
     * @param z Camera Z position
     * @returns The Y coordinate of the ceiling at (x, z), or null if not under mesh
     */
    getMeshCeilingAt(mesh, x, z) {
        // Quick bounding box check first
        if (x < mesh.min.x || x > mesh.max.x || z < mesh.min.z || z > mesh.max.z) {
            return null;
        }
        // Cast a ray upward from the camera position
        const rayStart = new Vector3(x, this.from.y, z);
        const rayDirection = new Vector3(0, 1, 0); // Straight up
        // Check intersection with mesh bounding box
        const intersections = this.intersectRayBox(rayStart, rayDirection, mesh.min, mesh.max);
        if (intersections.length === 0) {
            return null;
        }
        // The first intersection point (entry) gives us the ceiling height
        // We want the Y coordinate where the upward ray first hits the box
        const entryPoint = intersections[0];
        // Only return if the ceiling is above the current position
        if (entryPoint.y > this.from.y) {
            return entryPoint.y;
        }
        return null;
    }
    /**
     * Finds the highest surface below the camera by casting a downward ray.
     * Used for ground collision detection (walking on platforms).
     * @param mesh The mesh to check for ground collision
     * @param x Camera X position
     * @param z Camera Z position
     * @returns The Y coordinate of the ground at (x, z), or null if not over mesh
     */
    getMeshHeightAt(mesh, x, z) {
        // Quick bounding box check first
        if (x < mesh.min.x || x > mesh.max.x || z < mesh.min.z || z > mesh.max.z) {
            return null;
        }
        // Cast a ray downward from the camera position
        const rayStart = new Vector3(x, this.from.y, z);
        const rayDirection = new Vector3(0, -1, 0); // Straight down
        // Check intersection with mesh bounding box
        const intersections = this.intersectRayBox(rayStart, rayDirection, mesh.min, mesh.max);
        if (intersections.length === 0) {
            return null;
        }
        // The first intersection point (entry) gives us the ground height
        // We want the Y coordinate where the downward ray first hits the box
        const entryPoint = intersections[0];
        // Only return if the ground is below the current position
        if (entryPoint.y < this.from.y) {
            return entryPoint.y;
        }
        return null;
    }
    updatePhysics(elapsed) {
        // Only apply physics when mesh interaction is enabled
        if (!this.meshInteractionEnabled) {
            return;
        }
        // Apply gravity and update vertical position when jumping/falling
        if (this.isJumping) {
            this.verticalVelocity -= this.gravity * elapsed;
            this.from.y += this.verticalVelocity * elapsed;
            // Check for ceiling collision when moving upward
            if (this.verticalVelocity > 0) {
                const ceilingHeight = this.getCeilingHeight();
                if (ceilingHeight !== null && this.from.y >= ceilingHeight) {
                    // Hit the ceiling - stop upward movement and start falling
                    this.from.y = ceilingHeight;
                    this.verticalVelocity = 0; // Stop upward velocity, gravity will take over
                }
            }
            // Check if we've landed on ground
            const groundHeight = this.getGroundHeight();
            if (groundHeight !== null && this.from.y <= groundHeight) {
                this.from.y = groundHeight;
                this.verticalVelocity = 0;
                this.isJumping = false;
            }
            this.reorient();
        }
        else {
            // Even when not jumping, ensure we're on the ground (handles edge walking)
            const groundHeight = this.getGroundHeight();
            if (groundHeight !== null && Math.abs(this.from.y - groundHeight) > 0.01) {
                // If we're significantly off the ground, snap to it
                this.from.y = groundHeight;
                this.reorient();
            }
        }
    }
}
export class ThirdPersonCamera {
    constructor(anchor, to, offset) {
        this.anchor = anchor;
        const eyeToFocus = to.subtract(anchor);
        this.focalDistance = eyeToFocus.magnitude;
        this.forward = eyeToFocus.normalize();
        this.offset = offset;
        this.worldUp = new Vector3(0, 1, 0);
        this.reorient();
    }
    reorient() {
        this.right = this.forward.cross(this.worldUp).normalize();
        const up = this.right.cross(this.forward);
        // Build the avatar's matrices
        let avatarRotater = Matrix4.identity();
        avatarRotater.set(0, 0, this.right.x);
        avatarRotater.set(1, 0, this.right.y);
        avatarRotater.set(2, 0, this.right.z);
        avatarRotater.set(0, 1, up.x);
        avatarRotater.set(1, 1, up.y);
        avatarRotater.set(2, 1, up.z);
        avatarRotater.set(0, 2, -this.forward.x);
        avatarRotater.set(1, 2, -this.forward.y);
        avatarRotater.set(2, 2, -this.forward.z);
        let avatarTranslater = Matrix4.translate(this.anchor.x, this.anchor.y, this.anchor.z);
        this.worldFromModel = avatarTranslater.multiplyMatrix(avatarRotater);
        // Find the camera's world space position and build the eyeFromWorld matrix
        const cameraFrom = this.worldFromModel.multiplyVector3(this.offset);
        const focalPoint = this.anchor
            .add(this.forward.multiplyScalar(this.focalDistance));
        const cameraForward = focalPoint.subtract(cameraFrom).normalize();
        this.eyeFromWorld = Matrix4.look(cameraFrom, cameraForward, this.worldUp);
    }
    strafe(distance) {
        this.anchor = this.anchor.add(this.right.multiplyScalar(distance));
        this.reorient();
    }
    advance(distance) {
        this.anchor = this.anchor.add(this.forward.multiplyScalar(distance));
        this.reorient();
    }
    yaw(degrees) {
        const rotation = Matrix4.rotateAround(this.worldUp, degrees);
        this.forward = rotation.multiplyVector3(this.forward);
        this.reorient();
    }
}
export class TerrainCamera {
    constructor(from, to, field, offset, factors) {
        this.forward = to.subtract(from).normalize();
        this.from = from;
        this.worldUp = new Vector3(0, 1, 0);
        this.field = field;
        this.offset = offset;
        this.factors = factors;
        this.adjustY();
        this.reorient();
    }
    reorient() {
        this.eyeFromWorld = Matrix4.look(this.from, this.forward, this.worldUp);
        this.right = new Vector3(this.eyeFromWorld.get(0, 0), this.eyeFromWorld.get(0, 1), this.eyeFromWorld.get(0, 2));
    }
    strafe(distance) {
        this.from = this.from.add(this.right.multiplyScalar(distance));
        this.adjustY();
        this.reorient();
    }
    advance(distance) {
        this.from = this.from.add(this.forward.multiplyScalar(distance));
        this.adjustY();
        this.reorient();
    }
    yaw(degrees) {
        const rotation = Matrix4.rotateAround(this.worldUp, degrees);
        this.forward = rotation.multiplyVector3(this.forward);
        this.reorient();
    }
    pitch(degrees) {
        const rotation = Matrix4.rotateAround(this.right, degrees);
        this.forward = rotation.multiplyVector3(this.forward);
        this.reorient();
    }
    adjustY() {
        const x = this.from.x / this.factors.x;
        const z = this.from.z / this.factors.z;
        const height = this.field.blerp(x, z);
        this.from.y = height * this.factors.y + this.offset;
    }
}
