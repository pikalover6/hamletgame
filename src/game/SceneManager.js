import * as THREE from 'three'

export class SceneManager {
  constructor(scene) {
    this.scene = scene
    this.phase = 'start'

    this.startBounds = { minX: -6, maxX: 6, minZ: -6, maxZ: 6 }
    this.debateBounds = { minX: 38, maxX: 50, minZ: -8, maxZ: 8 }

    this.setupLights()
    this.createChambers()
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight(0xb8b9d4, 0x0d1018, 0.75)
    this.scene.add(hemi)

    this.mainLight = new THREE.DirectionalLight(0x9aa4e8, 0.9)
    this.mainLight.position.set(6, 10, 2)
    this.scene.add(this.mainLight)

    this.debateLight = new THREE.PointLight(0x8c3a6f, 1.1, 18)
    this.debateLight.position.set(44, 4, 0)
    this.scene.add(this.debateLight)
  }

  createChambers() {
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x232029, flatShading: true, roughness: 1 })
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x12121a, flatShading: true, roughness: 1 })

    this.startChamber = new THREE.Group()
    this.startChamber.position.set(0, 0, 0)
    this.startChamber.add(this.createRoomGeometry(floorMat, wallMat))

    this.debateChamber = new THREE.Group()
    this.debateChamber.position.set(44, 0, 0)
    this.debateChamber.add(this.createRoomGeometry(floorMat, wallMat, 0x1b1824))

    this.scene.add(this.startChamber, this.debateChamber)
  }

  createRoomGeometry(floorMat, wallMat, accentColor = 0x2d2a34) {
    const room = new THREE.Group()

    const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 12), floorMat)
    floor.position.y = -0.5

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(12, 0.4, 12), wallMat)
    ceiling.position.y = 6

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7, 12), wallMat)
    wallLeft.position.set(-6, 2.5, 0)

    const wallRight = wallLeft.clone()
    wallRight.position.x = 6

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 0.5), wallMat)
    wallBack.position.set(0, 2.5, -6)

    const wallFront = wallBack.clone()
    wallFront.position.z = 6

    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.2, 0),
      new THREE.MeshStandardMaterial({ color: accentColor, flatShading: true, emissive: accentColor, emissiveIntensity: 0.2 }),
    )
    core.position.set(0, 1.4, 0)

    room.add(floor, ceiling, wallLeft, wallRight, wallBack, wallFront, core)
    return room
  }

  getCurrentBounds() {
    return this.phase === 'start' ? this.startBounds : this.debateBounds
  }

  moveToDebate(player) {
    this.phase = 'debate'
    player.setPosition(new THREE.Vector3(40.5, 0, 0))
  }

  reset(player) {
    this.phase = 'start'
    player.setPosition(new THREE.Vector3(0, 0, 2.5))
  }
}
