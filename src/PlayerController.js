import * as THREE from "three";

const WORLD_UP = new THREE.Vector3(0, 1, 0);

function dampAngle(current, target, lambda, deltaTime) {
  let difference = target - current;

  while (difference > Math.PI) {
    difference -= Math.PI * 2;
  }

  while (difference < -Math.PI) {
    difference += Math.PI * 2;
  }

  return current + difference * (1 - Math.exp(-lambda * deltaTime));
}

export class PlayerController {
  constructor(character, camera, domElement) {
    this.character = character;
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = true;
    this.keys = new Set();
    this.bounds = null;
    this.yaw = Math.PI;
    this.pitch = -0.14;
    this.cameraRadius = 5.6;
    this.cameraFocus = new THREE.Vector3();
    this.cameraPosition = new THREE.Vector3();
    this.moveVector = new THREE.Vector3();
    this.forward = new THREE.Vector3();
    this.right = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.desiredVelocity = new THREE.Vector3();
    this.cameraLift = new THREE.Vector3(0, 2.3, 0);
    this.moveAmount = 0;
    this.maxSpeed = 4.8;
    this.acceleration = 12;
    this.deceleration = 10;

    this.colliders = [];
    this.raycaster = new THREE.Raycaster();
    this._rayOrigin = new THREE.Vector3();
    this._rayDown = new THREE.Vector3(0, -1, 0);
    this.stepHeight = 0.4;
    this._wasMoving = false;

    this._mouseButtonDown = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;

    window.addEventListener("keydown", (event) => this.onKeyDown(event));
    window.addEventListener("keyup", (event) => this.onKeyUp(event));
    document.addEventListener("mousemove", (event) => this.onMouseMove(event));

    this.domElement.addEventListener("mousedown", (event) => {
      this._mouseButtonDown = true;
      this._lastMouseX = event.clientX;
      this._lastMouseY = event.clientY;
      if (this.enabled) {
        this.requestPointerLock();
      }
    });

    document.addEventListener("mouseup", () => {
      this._mouseButtonDown = false;
    });

    this.domElement.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  onKeyDown(event) {
    this.keys.add(event.code);
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  onMouseMove(event) {
    if (!this.enabled) {
      return;
    }

    if (document.pointerLockElement === this.domElement) {
      this.yaw -= event.movementX * 0.0026;
      this.pitch -= event.movementY * 0.0019;
    } else if (this._mouseButtonDown) {
      const dx = event.clientX - this._lastMouseX;
      const dy = event.clientY - this._lastMouseY;
      this.yaw -= dx * 0.005;
      this.pitch -= dy * 0.004;
    }

    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -0.55, 0.45);
  }

  requestPointerLock() {
    if (document.pointerLockElement !== this.domElement) {
      this.domElement.requestPointerLock();
    }
  }

  releasePointerLock() {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;

    if (!enabled) {
      this.keys.clear();
      this.moveAmount = 0;
      this.releasePointerLock();
    }
  }

  setBounds(bounds) {
    this.bounds = bounds;
  }

  setColliders(meshes) {
    this.colliders = meshes;
  }

  snapToGround() {
    if (this.colliders.length === 0) {
      return;
    }

    const pos = this.character.position;
    this._rayOrigin.set(pos.x, pos.y + 2.0, pos.z);
    this.raycaster.set(this._rayOrigin, this._rayDown);
    this.raycaster.near = 0;
    this.raycaster.far = 4.0;

    const hits = this.raycaster.intersectObjects(this.colliders, false);
    for (const hit of hits) {
      if (hit.point.y <= pos.y + this.stepHeight) {
        pos.y = hit.point.y;
        return;
      }
    }
  }

  teleport(position, yaw = this.yaw) {
    this.character.position.copy(position);
    this.yaw = yaw;
    this._wasMoving = false;
    this.moveAmount = 0;
    this.velocity.set(0, 0, 0);
    this.desiredVelocity.set(0, 0, 0);
    this.snapToGround();
    this.updateCamera(0);
  }

  getMoveAmount() {
    return this.moveAmount;
  }

  getMovementSpeed() {
    return this.velocity.length();
  }

  update(deltaTime) {
    if (this.enabled) {
      const inputX = (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0);
      const inputZ = (this.keys.has("KeyW") ? 1 : 0) - (this.keys.has("KeyS") ? 1 : 0);
      const hasMovementInput = inputX !== 0 || inputZ !== 0;

      this.moveVector.set(0, 0, 0);
      this.desiredVelocity.set(0, 0, 0);

      if (hasMovementInput) {
        this.forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        this.right.crossVectors(this.forward, WORLD_UP).normalize();
        this.moveVector.addScaledVector(this.forward, inputZ);
        this.moveVector.addScaledVector(this.right, inputX);
        this.moveVector.normalize();
        this.desiredVelocity.copy(this.moveVector).multiplyScalar(this.maxSpeed);
        const targetRotation = Math.atan2(this.desiredVelocity.x, this.desiredVelocity.z);
        this.character.rotation.y = dampAngle(this.character.rotation.y, targetRotation, 10, deltaTime);
        this._wasMoving = true;
      } else if (this._wasMoving) {
        // Reorient camera yaw to be behind the character when stopping
        this.yaw = this.character.rotation.y;
        this._wasMoving = false;
      }

      const lambda = hasMovementInput ? this.acceleration : this.deceleration;
      this.velocity.lerp(this.desiredVelocity, 1 - Math.exp(-lambda * deltaTime));
      this.character.position.addScaledVector(this.velocity, deltaTime);
      this.snapToGround();
      this.moveAmount = THREE.MathUtils.damp(this.moveAmount, this.velocity.length() / this.maxSpeed, 12, deltaTime);

      if (this.bounds) {
        this.character.position.x = THREE.MathUtils.clamp(this.character.position.x, this.bounds.minX, this.bounds.maxX);
        this.character.position.z = THREE.MathUtils.clamp(this.character.position.z, this.bounds.minZ, this.bounds.maxZ);
      }
    } else {
      this.moveAmount = THREE.MathUtils.damp(this.moveAmount, 0, 12, deltaTime);
      this.velocity.lerp(this.desiredVelocity.set(0, 0, 0), 1 - Math.exp(-14 * deltaTime));
    }

    this.updateCamera(deltaTime);
  }

  updateCamera(deltaTime) {
    const horizontalDistance = Math.cos(this.pitch) * this.cameraRadius;
    const verticalDistance = Math.sin(-this.pitch) * this.cameraRadius + 1.9;
    this.forward.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    this.cameraFocus.copy(this.character.position).add(this.cameraLift);
    this.cameraPosition.copy(this.cameraFocus)
      .addScaledVector(this.forward, -horizontalDistance)
      .add(new THREE.Vector3(0, verticalDistance, 0));

    if (deltaTime === 0) {
      this.camera.position.copy(this.cameraPosition);
    } else {
      this.camera.position.lerp(this.cameraPosition, 1 - Math.exp(-10 * deltaTime));
    }

    this.camera.lookAt(this.cameraFocus);
  }
}