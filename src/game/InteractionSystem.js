export class InteractionSystem {
  constructor(dialogue) {
    this.dialogue = dialogue
    this.targets = []
    this.currentTarget = null

    window.addEventListener('keydown', (event) => {
      if (event.code === 'KeyE' && this.currentTarget && !this.dialogue.active) {
        this.currentTarget.onInteract()
      }
    })
  }

  setTargets(targets) {
    this.targets = targets
  }

  update({ playerPosition, enabled, onPrompt }) {
    this.currentTarget = null

    if (!enabled) {
      onPrompt('', false)
      return
    }

    let nearestDistance = Infinity
    for (const target of this.targets) {
      const distance = playerPosition.distanceTo(target.object.position)
      if (distance <= target.radius && distance < nearestDistance) {
        nearestDistance = distance
        this.currentTarget = target
      }
    }

    if (this.currentTarget) {
      onPrompt(this.currentTarget.prompt, true)
    } else {
      onPrompt('', false)
    }
  }
}
