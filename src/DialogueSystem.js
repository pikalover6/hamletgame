import { matchesCondition, resolveConditionalValue } from "./game/conditions.js";

export class DialogueSystem {
  constructor(ui) {
    this.ui = ui;
    this.nodes = {};
    this.currentKey = null;
    this.onComplete = null;
    this.onChoice = null;
    this.getStateSnapshot = null;
    this.stateSnapshot = {};
    this.availableChoices = [];

    this.ui.choiceA.addEventListener("click", () => this.choose(0));
    this.ui.choiceB.addEventListener("click", () => this.choose(1));
  }

  start({ nodes, startKey, stateSnapshot = {}, getStateSnapshot = null, onChoice = null, onComplete }) {
    this.nodes = nodes;
    this.currentKey = startKey;
    this.onComplete = onComplete;
    this.onChoice = onChoice;
    this.getStateSnapshot = getStateSnapshot;
    this.stateSnapshot = stateSnapshot;
    this.ui.dialogue.classList.remove("hidden");
    this.render();
  }

  isActive() {
    return !this.ui.dialogue.classList.contains("hidden");
  }

  close() {
    this.ui.dialogue.classList.add("hidden");
    this.currentKey = null;
    this.availableChoices = [];
  }

  choose(index) {
    const node = this.nodes[this.currentKey];

    if (!node) {
      return;
    }

    const choice = this.availableChoices[index];

    if (!choice) {
      return;
    }

    if (this.onChoice) {
      const nextSnapshot = this.onChoice(choice);

      if (nextSnapshot) {
        this.stateSnapshot = nextSnapshot;
      } else if (this.getStateSnapshot) {
        this.stateSnapshot = this.getStateSnapshot();
      }
    }

    if (choice.next === "END") {
      const onComplete = this.onComplete;
      this.close();

      if (onComplete) {
        onComplete({ choice, stateSnapshot: this.stateSnapshot });
      }

      return;
    }

    this.currentKey = choice.next;

    if (this.getStateSnapshot) {
      this.stateSnapshot = this.getStateSnapshot();
    }

    this.render();
  }

  render() {
    const node = this.nodes[this.currentKey];

    if (!node) {
      return;
    }

    this.availableChoices = (node.choices ?? []).filter((choice) => matchesCondition(choice.condition, this.stateSnapshot)).slice(0, 2);

    this.ui.speaker.textContent = resolveConditionalValue(node.speaker, this.stateSnapshot, node.speaker ?? "");
    this.ui.line.textContent = resolveConditionalValue(node.text, this.stateSnapshot, typeof node.text === "string" ? node.text : "");

    const [choiceA, choiceB] = this.availableChoices;
    this.ui.choiceA.textContent = choiceA?.label ?? "Continue";
    this.ui.choiceA.disabled = !choiceA;
    this.ui.choiceA.classList.toggle("hidden", !choiceA);

    this.ui.choiceB.textContent = choiceB?.label ?? "";
    this.ui.choiceB.disabled = !choiceB;
    this.ui.choiceB.classList.toggle("hidden", !choiceB);
  }
}