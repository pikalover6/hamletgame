import * as THREE from 'three'

const PLAYER_HEIGHT = 1.4

export class PlayerController {
  constructor({ camera, domElement, model, getBounds }) {
    this.camera = camera
    this.domElement = domElement
    this.model = model
    this.getBounds = getBounds

    this.position = new THREE.Vector3(0, 0, 2.5)
    this.moveSpeed = 4.5
    this.yaw = Math.PI
    this.pitch = -0.12
    this.keys = { KeyW: false, KeyA: false, KeyS: false, KeyD: false }
    this.inputEnabled = true

    this.pointerLocked = false
    this.lookSensitivity = 0.0022

    this.bindEvents()
    this.syncTransforms()
  }

  bindEvents() {
    window.addEventListener('keydown', (event) => {
      if (event.code in this.keys) this.keys[event.code] = true
    })

    window.addEventListener('keyup', (event) => {
      if (event.code in this.keys) this.keys[event.code] = false
    })

    this.domElement.addEventListener('click', () => {
      if (!this.pointerLocked) this.domElement.requestPointerLock()
    })

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.domElement
    })

    window.addEventListener('mousemove', (event) => {
      if (!this.inputEnabled || !this.pointerLocked) return
      this.yaw -= event.movementX * this.lookSensitivity
      this.pitch -= event.movementY * this.lookSensitivity
      this.pitch = THREE.MathUtils.clamp(this.pitch, -0.55, 0.45)
    })
  }

  setInputEnabled(enabled) {
    this.inputEnabled = enabled
  }

  setPosition(position) {
    this.position.copy(position)
    this.syncTransforms()
  }

  update(delta) {
    if (!this.inputEnabled) {
      this.syncTransforms()
      return
    }

    const input = new THREE.Vector2(
      Number(this.keys.KeyD) - Number(this.keys.KeyA),
      Number(this.keys.KeyW) - Number(this.keys.KeyS),
    )

    if (input.lengthSq() > 0) {
      input.normalize()
      const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).multiplyScalar(input.y)
      const strafe = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(input.x)
      const movement = forward.add(strafe).multiplyScalar(this.moveSpeed * delta)
      this.position.add(movement)

      const bounds = this.getBounds()
      this.position.x = THREE.MathUtils.clamp(this.position.x, bounds.minX, bounds.maxX)
      this.position.z = THREE.MathUtils.clamp(this.position.z, bounds.minZ, bounds.maxZ)
    }

    this.syncTransforms()
  }

  syncTransforms() {
    this.model.position.copy(this.position)
    this.model.rotation.y = this.yaw

    const cameraOffset = new THREE.Vector3(0, PLAYER_HEIGHT + 0.6, 2.8)
    cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw)
    cameraOffset.y += Math.sin(this.pitch) * 2.1

    this.camera.position.copy(this.position).add(cameraOffset)
    this.camera.lookAt(this.position.x, this.position.y + PLAYER_HEIGHT, this.position.z)
  }
}
