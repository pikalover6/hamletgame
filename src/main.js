import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { PlayerController } from './game/PlayerController.js'
import { InteractionSystem } from './game/InteractionSystem.js'
import { DialogueSystem } from './game/DialogueSystem.js'
import { SceneManager } from './game/SceneManager.js'
import { RendererPipeline } from './game/RendererPipeline.js'

const appRoot = document.querySelector('#app')
appRoot.innerHTML = `
  <canvas id="game-canvas"></canvas>
  <div id="ui">
    <div id="prompt" class="hidden">Press E</div>
    <div id="dialogue" class="hidden">
      <p id="dialogue-speaker"></p>
      <p id="dialogue-line"></p>
      <div id="choices"></div>
    </div>
    <div id="ending" class="hidden">
      <h1>Inside Hamlet's Mind</h1>
      <p id="ending-text"></p>
      <button id="restart">Restart</button>
    </div>
  </div>
`

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x08070d)
scene.fog = new THREE.Fog(0x08070d, 8, 62)

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 120)
const rendererPipeline = new RendererPipeline(document.querySelector('#game-canvas'), scene, camera)
const sceneManager = new SceneManager(scene)
const dialogue = new DialogueSystem()
const interaction = new InteractionSystem(dialogue)

let alignment = 'philosopher'
let canFinalize = false

const loader = new GLTFLoader()

const createFallbackSuit = (color) => {
  const group = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.3, 1.1, 4, 8),
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, metalness: 0.02 }),
  )
  const head = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.25, 0),
    new THREE.MeshStandardMaterial({ color: 0xc2bfb6, flatShading: true, roughness: 1 }),
  )
  head.position.y = 1.05
  group.add(body, head)
  return group
}

const loadSuitModel = async (color) => {
  try {
    const gltf = await loader.loadAsync('/a_man_in_suit.glb')
    const model = gltf.scene.clone(true)
    model.traverse((child) => {
      if (!child.isMesh) return
      const base = child.material?.clone?.() ?? new THREE.MeshStandardMaterial()
      base.flatShading = true
      if (child.name.toLowerCase().includes('face') || child.name.toLowerCase().includes('head')) {
        base.color = new THREE.Color(0xbfb5ad)
      } else {
        base.color = new THREE.Color(color)
      }
      base.roughness = 0.95
      base.metalness = 0.03
      child.material = base
      child.castShadow = false
      child.receiveShadow = false
    })
    return model
  } catch {
    return createFallbackSuit(color)
  }
}

const createNpc = async (name, color, position) => {
  const root = await loadSuitModel(color)
  root.position.copy(position)
  root.scale.setScalar(1.1)
  root.userData.baseY = position.y
  root.userData.npcName = name
  scene.add(root)
  return root
}

const boot = async () => {
  const playerModel = await loadSuitModel(0x4f4a58)
  scene.add(playerModel)

  const player = new PlayerController({
    camera,
    domElement: rendererPipeline.renderer.domElement,
    model: playerModel,
    getBounds: () => sceneManager.getCurrentBounds(),
  })

  const avenger = await createNpc('The Avenger', 0x8e2c2c, new THREE.Vector3(2.8, 0, -2.5))
  const philosopher = await createNpc('The Philosopher', 0x334a7a, new THREE.Vector3(44, 0, -1.5))

  const updatePrompt = (text, visible) => {
    const prompt = document.querySelector('#prompt')
    prompt.textContent = text
    prompt.classList.toggle('hidden', !visible)
  }

  const updateEnding = () => {
    const ending = document.querySelector('#ending')
    const endingText = document.querySelector('#ending-text')
    endingText.textContent =
      alignment === 'avenger'
        ? 'You choose motion over proof. Steel answers doubt, but conscience remains behind.'
        : 'You choose proof over motion. Thought keeps blood from your hands, and action slips away.'
    ending.classList.remove('hidden')
  }

  interaction.setTargets([
    {
      object: avenger,
      radius: 2.2,
      prompt: 'Press E to confront The Avenger',
      onInteract: () => {
        if (sceneManager.phase !== 'start') return
        dialogue.start({
          speaker: 'The Avenger',
          nodes: [
            {
              line: 'You hesitate again. Claudius still breathes.',
              choices: [
                { text: 'Strike now. Delay is cowardice.', alignment: 'avenger' },
                { text: 'Wait. Certainty must come first.', alignment: 'philosopher' },
              ],
            },
            {
              line: 'Appearance deceives. Will you trust the play or your pulse?',
              choices: [
                { text: 'Trust the pulse. Revenge needs risk.', alignment: 'avenger' },
                { text: 'Trust the test. Reality needs proof.', alignment: 'philosopher' },
              ],
            },
            {
              line: 'Thought circles. Action cuts. Which rule commands you?',
              choices: [
                { text: 'Action first. Let meaning follow.', alignment: 'avenger' },
                { text: 'Meaning first. Action must answer morality.', alignment: 'philosopher' },
              ],
            },
          ],
          onChoice: (choice) => {
            alignment = choice.alignment
          },
          onComplete: (resultAlignment) => {
            alignment = resultAlignment
            sceneManager.moveToDebate(player)
            canFinalize = true
          },
        })
      },
    },
    {
      object: philosopher,
      radius: 2.4,
      prompt: 'Press E to hear The Philosopher',
      onInteract: () => {
        if (sceneManager.phase !== 'debate' || !canFinalize) return
        dialogue.showFinalLine(
          'The Philosopher',
          alignment === 'avenger'
            ? 'Action wins the hour. Morality waits in the dark.'
            : 'Morality wins the hour. Revenge fades into thought.',
          () => {
            sceneManager.phase = 'ending'
            updateEnding()
          },
        )
      },
    },
  ])

  document.querySelector('#restart').addEventListener('click', () => {
    alignment = 'philosopher'
    canFinalize = false
    document.querySelector('#ending').classList.add('hidden')
    sceneManager.reset(player)
  })

  const clock = new THREE.Clock()

  const animate = () => {
    const delta = Math.min(clock.getDelta(), 0.04)
    const elapsed = clock.elapsedTime

    player.setInputEnabled(!dialogue.active && sceneManager.phase !== 'ending')
    player.update(delta)

    avenger.position.y = avenger.userData.baseY + Math.sin(elapsed * 1.4) * 0.05
    philosopher.position.y = philosopher.userData.baseY + Math.sin(elapsed * 1.1 + 0.7) * 0.05

    interaction.update({
      playerPosition: player.position,
      enabled: !dialogue.active && sceneManager.phase !== 'ending',
      onPrompt: updatePrompt,
    })

    rendererPipeline.render(elapsed)
    requestAnimationFrame(animate)
  }

  animate()
}

boot()
