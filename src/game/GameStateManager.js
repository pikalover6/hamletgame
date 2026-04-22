const STORAGE_KEY = "inside-hamlets-mind-save-v2";

function createDefaultState() {
  return {
    currentChamber: "start",
    objectiveKey: "start.approach",
    lastCheckpoint: "start",
    avengerScore: 0,
    philosopherScore: 0,
    actorScore: 0,
    fatalistScore: 0,
    resolvedFlags: [],
    visitedChambers: ["start"],
    completedEncounters: [],
    collectedFragments: [],
    activatedStageMarks: [],
    activatedJudgmentPlates: [],
    unlockedEndings: [],
  };
}

function mergeUnique(existing = [], incoming = []) {
  return Array.from(new Set([...(existing ?? []), ...(incoming ?? [])]));
}

function normalizeState(candidate = {}) {
  const defaults = createDefaultState();

  return {
    ...defaults,
    ...candidate,
    resolvedFlags: mergeUnique(defaults.resolvedFlags, candidate.resolvedFlags),
    visitedChambers: mergeUnique(defaults.visitedChambers, candidate.visitedChambers),
    completedEncounters: mergeUnique(defaults.completedEncounters, candidate.completedEncounters),
    collectedFragments: mergeUnique(defaults.collectedFragments, candidate.collectedFragments),
    activatedStageMarks: mergeUnique(defaults.activatedStageMarks, candidate.activatedStageMarks),
    activatedJudgmentPlates: mergeUnique(defaults.activatedJudgmentPlates, candidate.activatedJudgmentPlates),
    unlockedEndings: mergeUnique(defaults.unlockedEndings, candidate.unlockedEndings),
  };
}

export class GameStateManager {
  constructor(storage = window.localStorage) {
    this.storage = storage;
    this.state = createDefaultState();
  }

  startNewGame() {
    this.state = createDefaultState();
    this.save();
    return this.getSnapshot();
  }

  load() {
    const raw = this.storage.getItem(STORAGE_KEY);

    if (!raw) {
      this.state = createDefaultState();
      return this.getSnapshot();
    }

    try {
      this.state = normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn("[GameStateManager] Save data was invalid, resetting.", error);
      this.state = createDefaultState();
    }

    return this.getSnapshot();
  }

  save() {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  clearSave() {
    this.storage.removeItem(STORAGE_KEY);
  }

  getSnapshot() {
    return {
      ...this.state,
      resolvedFlags: [...this.state.resolvedFlags],
      visitedChambers: [...this.state.visitedChambers],
      completedEncounters: [...this.state.completedEncounters],
      collectedFragments: [...this.state.collectedFragments],
      activatedStageMarks: [...this.state.activatedStageMarks],
      activatedJudgmentPlates: [...this.state.activatedJudgmentPlates],
      unlockedEndings: [...this.state.unlockedEndings],
      dominantArchetype: this.getDominantArchetype(),
    };
  }

  hasSave() {
    return Boolean(this.storage.getItem(STORAGE_KEY));
  }

  hasFlag(flag) {
    return this.state.resolvedFlags.includes(flag);
  }

  setCurrentChamber(chamberId) {
    this.state.currentChamber = chamberId;
    this.state.lastCheckpoint = chamberId;
    this.markVisited(chamberId);
  }

  setObjective(objectiveKey) {
    this.state.objectiveKey = objectiveKey;
  }

  markVisited(chamberId) {
    if (!this.state.visitedChambers.includes(chamberId)) {
      this.state.visitedChambers.push(chamberId);
    }
  }

  markEncounterComplete(encounterId) {
    if (!this.state.completedEncounters.includes(encounterId)) {
      this.state.completedEncounters.push(encounterId);
    }
  }

  markFlag(flag) {
    if (!this.state.resolvedFlags.includes(flag)) {
      this.state.resolvedFlags.push(flag);
    }
  }

  clearFlag(flag) {
    this.state.resolvedFlags = this.state.resolvedFlags.filter((entry) => entry !== flag);
  }

  markCollection(listKey, token) {
    const list = this.state[listKey];

    if (Array.isArray(list) && !list.includes(token)) {
      list.push(token);
    }
  }

  applyEffects(effects = {}) {
    this.state.avengerScore += effects.avengerScore ?? 0;
    this.state.philosopherScore += effects.philosopherScore ?? 0;
    this.state.actorScore += effects.actorScore ?? 0;
    this.state.fatalistScore += effects.fatalistScore ?? 0;

    for (const flag of effects.addFlags ?? []) {
      this.markFlag(flag);
    }

    for (const flag of effects.removeFlags ?? []) {
      this.clearFlag(flag);
    }

    for (const token of effects.collectFragments ?? []) {
      this.markCollection("collectedFragments", token);
    }

    for (const token of effects.activateStageMarks ?? []) {
      this.markCollection("activatedStageMarks", token);
    }

    for (const token of effects.activateJudgmentPlates ?? []) {
      this.markCollection("activatedJudgmentPlates", token);
    }

    if (effects.completeEncounter) {
      this.markEncounterComplete(effects.completeEncounter);
    }

    if (effects.objectiveKey) {
      this.setObjective(effects.objectiveKey);
    }

    if (effects.currentChamber) {
      this.setCurrentChamber(effects.currentChamber);
    }

    this.save();
  }

  getDominantArchetype() {
    const scores = [
      ["avenger", this.state.avengerScore],
      ["philosopher", this.state.philosopherScore],
      ["actor", this.state.actorScore],
      ["fatalist", this.state.fatalistScore],
    ].sort((left, right) => right[1] - left[1]);

    const [topKey, topScore] = scores[0];
    const secondScore = scores[1][1];
    const embraceFracture = this.hasFlag("ending.embraceFracture");

    if (embraceFracture || topScore === secondScore || (topScore - secondScore <= 1 && this.state.fatalistScore >= 2)) {
      return "fractured";
    }

    return topKey;
  }

  resolveEnding() {
    const endingId = this.getDominantArchetype();

    if (!this.state.unlockedEndings.includes(endingId)) {
      this.state.unlockedEndings.push(endingId);
    }

    this.save();
    return endingId;
  }
}