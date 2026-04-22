import * as THREE from "three";

const scratchPosition = new THREE.Vector3();

export class InteractionSystem {
  constructor(ui) {
    this.ui = ui;
    this.interactables = [];
    this.closest = null;
  }

  register(definition) {
    this.interactables.push(definition);
  }

  update(playerPosition) {
    let closest = null;
    let closestDistance = Infinity;

    for (const interactable of this.interactables) {
      if (!interactable.isAvailable()) {
        continue;
      }

      if (interactable.object.visible === false) {
        continue;
      }

      const targetPosition = interactable.object.getWorldPosition
        ? interactable.object.getWorldPosition(scratchPosition)
        : interactable.object.position;
      const distance = playerPosition.distanceTo(targetPosition);

      if (distance <= interactable.radius && distance < closestDistance) {
        closest = interactable;
        closestDistance = distance;
      }
    }

    this.closest = closest;

    if (closest) {
      this.ui.interactionPrompt.textContent = closest.prompt;
      this.ui.interactionPrompt.classList.remove("hidden");
      return;
    }

    this.ui.interactionPrompt.classList.add("hidden");
  }

  interact() {
    if (this.closest) {
      this.closest.onInteract();
    }
  }
}