import * as THREE from "three";
import { DialogueSystem } from "../DialogueSystem.js";
import { EnvironmentController } from "../Environment.js";
import { InteractionSystem } from "../InteractionSystem.js";
import { PlayerController } from "../PlayerController.js";
import { createComposer, applyPostProcessingMood } from "../PostProcessing.js";
import { CHARACTER_VARIANTS, createCharacter, loadBaseCharacterAssets } from "../characters/CharacterFactory.js";
import { CHAMBER_DEFINITIONS } from "../data/chambers.js";
import { ENCOUNTER_DATA } from "../data/dialogueGraph.js";
import { ENDING_CONTENT } from "../data/endings.js";
import { OBJECTIVE_TEXT } from "../data/objectives.js";
import { AudioManager } from "../audio/AudioManager.js";
import { GameStateManager } from "./GameStateManager.js";
import { getUiElements } from "../ui/uiElements.js";

function updateNpcPresence(npc, time, phase, lookTarget) {
  if (!npc.visible) {
    return;
  }

  npc.position.y = npc.userData.baseY + Math.sin(time * 0.8 + phase) * 0.014;
  const toPlayer = lookTarget.clone().sub(npc.position);
  toPlayer.y = 0;

  if (toPlayer.lengthSq() > 0.001) {
    const targetRotation = Math.atan2(toPlayer.x, toPlayer.z);
    npc.rotation.y = THREE.MathUtils.lerp(npc.rotation.y, targetRotation, 0.04);
  }
}

export function startGame() {
  const ui = getUiElements();
  const app = document.querySelector("#app");
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "game-canvas";
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2("#b8c8ce", 0.022);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 240);
  const clock = new THREE.Clock();
  const dialogue = new DialogueSystem(ui);
  const interactions = new InteractionSystem(ui);
  const stateManager = new GameStateManager();
  const audio = new AudioManager();

  const hemisphereLight = new THREE.HemisphereLight("#f0efe5", "#42545e", 1.85);
  const directionalLight = new THREE.DirectionalLight("#fff1d4", 1.4);
  directionalLight.position.set(8, 14, 6);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.camera.left = -18;
  directionalLight.shadow.camera.right = 18;
  directionalLight.shadow.camera.top = 18;
  directionalLight.shadow.camera.bottom = -18;
  directionalLight.shadow.normalBias = 0.03;
  scene.add(hemisphereLight, directionalLight);

  const { composer, stylizePass } = createComposer(renderer, scene, camera);
  const environment = new EnvironmentController(scene);

  let mode = "loading";
  let playerController = null;
  let chapterCardTimer = 0;
  let transitionTimerA = 0;
  let transitionTimerB = 0;
  let characters = null;
  let groundColliders = [];
  const npcRaycaster = new THREE.Raycaster();
  const _npcRayDown = new THREE.Vector3(0, -1, 0);

  function snapYToGround(worldPosition) {
    if (groundColliders.length === 0) {
      return worldPosition.y;
    }

    const origin = new THREE.Vector3(worldPosition.x, worldPosition.y + 3, worldPosition.z);
    npcRaycaster.set(origin, _npcRayDown);
    npcRaycaster.near = 0;
    npcRaycaster.far = 8;
    const hits = npcRaycaster.intersectObjects(groundColliders, false);
    return hits.length > 0 ? hits[0].point.y : worldPosition.y;
  }

  function setInternalResolution() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const scale = width < 900 ? 0.84 : 0.78;
    const renderWidth = Math.max(640, Math.floor(width * scale));
    const renderHeight = Math.max(360, Math.floor(height * scale));

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(1);
    renderer.setSize(renderWidth, renderHeight, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    composer.setSize(renderWidth, renderHeight);
  }

  function isExploreMode(chamberId) {
    const snapshot = stateManager.getSnapshot();
    return mode === "explore" && snapshot.currentChamber === chamberId;
  }

  function updateTitleButtons() {
    const hasSave = stateManager.hasSave();
    ui.continueButton.classList.toggle("hidden", !hasSave);
    ui.continueButton.disabled = !hasSave;
  }

  function updateObjectiveText(snapshot) {
    ui.objectiveText.textContent = OBJECTIVE_TEXT[snapshot.objectiveKey] ?? "Continue inward.";
  }

  function showChapterCard(chamberId) {
    const chamber = CHAMBER_DEFINITIONS[chamberId];
    ui.chapterCardTitle.textContent = chamber.title;
    ui.chapterCardSubtitle.textContent = chamber.subtitle;
    ui.chapterCard.classList.remove("hidden");
    window.clearTimeout(chapterCardTimer);
    chapterCardTimer = window.setTimeout(() => {
      ui.chapterCard.classList.add("hidden");
    }, 2400);
  }

  function hideScreenOverlays() {
    ui.titleScreen.classList.add("hidden");
    ui.pauseMenu.classList.add("hidden");
    ui.ending.classList.add("hidden");
  }

  function placeCharacter(character, position, visible) {
    character.container.visible = visible;
    if (!visible) {
      return;
    }

    character.container.position.copy(position);
    character.container.position.y = snapYToGround(position);
    character.container.userData.baseY = character.container.position.y;
  }

  function syncCharacterPresence(snapshot) {
    if (!characters) {
      return;
    }

    const { philosopher, avenger, actor, witness } = characters.voices;
    const chamberId = snapshot.currentChamber;
    const finale = chamberId === "consequence";

    placeCharacter(philosopher, environment.getNpcPosition(finale ? "consequence" : "start", "philosopher"), chamberId === "start" || finale);
    placeCharacter(avenger, environment.getNpcPosition(finale ? "consequence" : "debate", "avenger"), chamberId === "debate" || finale);
    placeCharacter(actor, environment.getNpcPosition(finale ? "consequence" : "stageOfMasks", "actor"), chamberId === "stageOfMasks" || finale);
    placeCharacter(witness, environment.getNpcPosition(finale ? "consequence" : "hallOfDelay", "witness"), chamberId === "hallOfDelay" || finale);
  }

  function syncWorld(snapshot) {
    const mood = environment.setMood(snapshot.currentChamber, snapshot.dominantArchetype);
    environment.applyProgressState(snapshot);
    applyPostProcessingMood(stylizePass, mood);
    updateObjectiveText(snapshot);
    syncCharacterPresence(snapshot);
    updateTitleButtons();
    audio.setChamber(snapshot.currentChamber);
  }

  function setExploreHudVisible(visible) {
    ui.objectivePanel.classList.toggle("hidden", !visible);
    if (!visible) {
      ui.interactionPrompt.classList.add("hidden");
    }
  }

  function showTitleScreen() {
    window.clearTimeout(transitionTimerA);
    window.clearTimeout(transitionTimerB);
    mode = "title";
    playerController?.setEnabled(false);
    hideScreenOverlays();
    ui.titleScreen.classList.remove("hidden");
    ui.focusHint.classList.add("hidden");
    setExploreHudVisible(false);
    updateTitleButtons();
  }

  function openPauseMenu() {
    if (mode !== "explore") {
      return;
    }

    mode = "pause";
    playerController?.setEnabled(false);
    ui.pauseMenu.classList.remove("hidden");
    setExploreHudVisible(true);
  }

  function closePauseMenu() {
    if (mode !== "pause") {
      return;
    }

    mode = "explore";
    ui.pauseMenu.classList.add("hidden");
    playerController?.setEnabled(true);
  }

  function showEnding(endingId) {
    const ending = ENDING_CONTENT[endingId];
    mode = "ending";
    playerController?.setEnabled(false);
    ui.interactionPrompt.classList.add("hidden");
    ui.focusHint.classList.add("hidden");
    ui.objectivePanel.classList.add("hidden");
    ui.endingTitle.textContent = ending.title;
    ui.endingLineA.textContent = ending.lineA;
    ui.endingLineB.textContent = ending.lineB;
    ui.ending.classList.remove("hidden");
    scene.background = new THREE.Color(ending.mood.background);
    scene.fog.color.set(ending.mood.fog);
    applyPostProcessingMood(stylizePass, {
      ...CHAMBER_DEFINITIONS.consequence.mood,
      tint: ending.mood.tint,
      aberration: 0.02,
      pulse: endingId === "fractured" ? 0.085 : 0.05,
    });
    audio.playEnding(endingId);
  }

  function transitionToChamber(chamberId, { instant = false, showCard = true } = {}) {
    const performTeleport = () => {
      stateManager.applyEffects({ currentChamber: chamberId });
      const snapshot = stateManager.getSnapshot();
      playerController.setBounds(environment.getBounds(chamberId));
      playerController.teleport(environment.getSpawn(chamberId), Math.PI);
      syncWorld(snapshot);
      if (showCard) {
        showChapterCard(chamberId);
      }
    };

    window.clearTimeout(transitionTimerA);
    window.clearTimeout(transitionTimerB);

    if (instant) {
      performTeleport();
      return;
    }

    mode = "transition";
    playerController.setEnabled(false);
    ui.interactionPrompt.classList.add("hidden");
    ui.transition.classList.add("active");
    audio.playInteraction("transition");

    transitionTimerA = window.setTimeout(() => {
      performTeleport();
    }, 360);

    transitionTimerB = window.setTimeout(() => {
      ui.transition.classList.remove("active");
      mode = "explore";
      playerController.setEnabled(true);
    }, 760);
  }

  function handleCollectionProgress() {
    const snapshot = stateManager.getSnapshot();

    if (snapshot.currentChamber === "hallOfDelay" && snapshot.collectedFragments.length >= 3 && !snapshot.resolvedFlags.includes("delay.fragments.complete")) {
      stateManager.applyEffects({ addFlags: ["delay.fragments.complete"], objectiveKey: "delay.witness" });
    }

    if (snapshot.currentChamber === "stageOfMasks" && snapshot.activatedStageMarks.length >= 3 && !snapshot.resolvedFlags.includes("masks.marks.complete")) {
      stateManager.applyEffects({ addFlags: ["masks.marks.complete"], objectiveKey: "masks.actor" });
    }

    if (snapshot.currentChamber === "consequence" && snapshot.activatedJudgmentPlates.length >= 3 && !snapshot.resolvedFlags.includes("consequence.plates.complete")) {
      stateManager.applyEffects({ addFlags: ["consequence.plates.complete"], objectiveKey: "consequence.final" });
    }

    syncWorld(stateManager.getSnapshot());
  }

  function startEncounter(encounterId) {
    if (mode !== "explore") {
      return;
    }

    const encounter = ENCOUNTER_DATA[encounterId];
    mode = "dialogue";
    playerController.setEnabled(false);
    ui.interactionPrompt.classList.add("hidden");
    dialogue.start({
      nodes: encounter.nodes,
      startKey: encounter.startKey,
      stateSnapshot: stateManager.getSnapshot(),
      getStateSnapshot: () => stateManager.getSnapshot(),
      onChoice: (choice) => {
        if (choice.effects) {
          stateManager.applyEffects(choice.effects);
        }

        syncWorld(stateManager.getSnapshot());
        return stateManager.getSnapshot();
      },
      onComplete: () => {
        if (encounterId === "consequenceJudgment") {
          const endingId = stateManager.resolveEnding();
          showEnding(endingId);
          return;
        }

        mode = "explore";
        playerController.setEnabled(true);
        syncWorld(stateManager.getSnapshot());
      },
    });
  }

  function collectFragment(fragmentId) {
    stateManager.applyEffects({ collectFragments: [fragmentId] });
    audio.playInteraction("fragment");
    handleCollectionProgress();
  }

  function activateStageMark(markId) {
    stateManager.applyEffects({ activateStageMarks: [markId] });
    audio.playInteraction("mark");
    handleCollectionProgress();
  }

  function activateJudgmentPlate(plateId) {
    stateManager.applyEffects({ activateJudgmentPlates: [plateId] });
    audio.playInteraction("plate");
    handleCollectionProgress();
  }

  function registerInteractions() {
    interactions.register({
      object: characters.voices.philosopher.container,
      radius: 2.7,
      prompt: "Press E to answer the Philosopher (Polonius is dead)",
      isAvailable: () => isExploreMode("start") && !stateManager.getSnapshot().completedEncounters.includes("philosopherIntro"),
      onInteract: () => startEncounter("philosopherIntro"),
    });

    interactions.register({
      object: characters.voices.avenger.container,
      radius: 2.8,
      prompt: "Press E to face the Avenger (England awaits)",
      isAvailable: () => isExploreMode("debate") && !stateManager.getSnapshot().completedEncounters.includes("avengerDebate"),
      onInteract: () => startEncounter("avengerDebate"),
    });

    interactions.register({
      object: characters.voices.witness.container,
      radius: 2.8,
      prompt: "Press E to hear the Witness (Ophelia sings)",
      isAvailable: () => isExploreMode("hallOfDelay") && stateManager.getSnapshot().collectedFragments.length >= 3 && !stateManager.getSnapshot().completedEncounters.includes("witnessDelay"),
      onInteract: () => startEncounter("witnessDelay"),
    });

    interactions.register({
      object: characters.voices.actor.container,
      radius: 2.8,
      prompt: "Press E to answer the Actor (madness as mask?)",
      isAvailable: () => isExploreMode("stageOfMasks") && stateManager.getSnapshot().activatedStageMarks.length >= 3 && !stateManager.getSnapshot().completedEncounters.includes("actorMasks"),
      onInteract: () => startEncounter("actorMasks"),
    });

    interactions.register({
      object: environment.getTransitionObject("start"),
      radius: 2.4,
      prompt: "Press E to enter the Debate Chamber (Claudius watches)",
      isAvailable: () => isExploreMode("start") && stateManager.getSnapshot().completedEncounters.includes("philosopherIntro"),
      onInteract: () => transitionToChamber("debate"),
    });

    interactions.register({
      object: environment.getTransitionObject("debate"),
      radius: 2.4,
      prompt: "Press E to enter the Hall of Delay (Laertes returns)",
      isAvailable: () => isExploreMode("debate") && stateManager.getSnapshot().completedEncounters.includes("avengerDebate"),
      onInteract: () => {
        stateManager.applyEffects({ objectiveKey: "delay.fragments" });
        transitionToChamber("hallOfDelay");
      },
    });

    interactions.register({
      object: environment.getTransitionObject("hallOfDelay"),
      radius: 2.4,
      prompt: "Press E to step onto the Stage of Masks (play along)",
      isAvailable: () => isExploreMode("hallOfDelay") && stateManager.getSnapshot().completedEncounters.includes("witnessDelay"),
      onInteract: () => {
        stateManager.applyEffects({ objectiveKey: "masks.marks" });
        transitionToChamber("stageOfMasks");
      },
    });

    interactions.register({
      object: environment.getTransitionObject("stageOfMasks"),
      radius: 2.4,
      prompt: "Press E to enter the Chamber of Consequence (judgment waits)",
      isAvailable: () => isExploreMode("stageOfMasks") && stateManager.getSnapshot().completedEncounters.includes("actorMasks"),
      onInteract: () => {
        stateManager.applyEffects({ objectiveKey: "consequence.plates" });
        transitionToChamber("consequence");
      },
    });

    for (const fragmentId of Object.keys(CHAMBER_DEFINITIONS.hallOfDelay.fragments)) {
      interactions.register({
        object: environment.getFragmentObject(fragmentId),
        radius: 2.1,
        prompt: "Press E to gather an Act IV fragment",
        isAvailable: () => isExploreMode("hallOfDelay") && !stateManager.getSnapshot().collectedFragments.includes(fragmentId),
        onInteract: () => collectFragment(fragmentId),
      });
    }

    for (const markId of Object.keys(CHAMBER_DEFINITIONS.stageOfMasks.stageMarks)) {
      interactions.register({
        object: environment.getStageMarkObject(markId),
        radius: 2.2,
        prompt: "Press E to hold the performance mark",
        isAvailable: () => isExploreMode("stageOfMasks") && !stateManager.getSnapshot().activatedStageMarks.includes(markId),
        onInteract: () => activateStageMark(markId),
      });
    }

    for (const plateId of Object.keys(CHAMBER_DEFINITIONS.consequence.judgmentPlates)) {
      interactions.register({
        object: environment.getJudgmentPlateObject(plateId),
        radius: 2.2,
        prompt: "Press E to wake the judgment plate",
        isAvailable: () => isExploreMode("consequence") && !stateManager.getSnapshot().activatedJudgmentPlates.includes(plateId),
        onInteract: () => activateJudgmentPlate(plateId),
      });
    }

    interactions.register({
      object: environment.getFinalDaisObject(),
      radius: 2.5,
      prompt: "Press E to let your chosen voice rule Hamlet",
      isAvailable: () => isExploreMode("consequence") && stateManager.getSnapshot().activatedJudgmentPlates.length >= 3 && !stateManager.getSnapshot().completedEncounters.includes("consequenceJudgment"),
      onInteract: () => startEncounter("consequenceJudgment"),
    });
  }

  async function buildCharacters() {
    const { baseScene, walkClip, idleClip } = await loadBaseCharacterAssets();
    const player = createCharacter(baseScene, CHARACTER_VARIANTS.player);
    const philosopher = createCharacter(baseScene, CHARACTER_VARIANTS.philosopher);
    const avenger = createCharacter(baseScene, CHARACTER_VARIANTS.avenger);
    const actor = createCharacter(baseScene, CHARACTER_VARIANTS.actor);
    const witness = createCharacter(baseScene, CHARACTER_VARIANTS.witness);

    if (idleClip) {
      for (const char of [player, philosopher, avenger, actor, witness]) {
        char.animator.loadIdleClip(idleClip);
      }
    }
    if (walkClip) {
      player.animator.loadWalkClip(walkClip);
    }

    scene.add(player.container, philosopher.container, avenger.container, actor.container, witness.container);

    return {
      player,
      voices: { philosopher, avenger, actor, witness },
    };
  }

  function beginRun(loadSaved) {
    hideScreenOverlays();
    setExploreHudVisible(true);
    ui.focusHint.classList.remove("hidden");
    const snapshot = loadSaved ? stateManager.load() : stateManager.startNewGame();
    playerController.setBounds(environment.getBounds(snapshot.currentChamber));
    playerController.teleport(environment.getSpawn(snapshot.currentChamber), Math.PI);
    syncWorld(snapshot);
    showChapterCard(snapshot.currentChamber);
    mode = "explore";
    playerController.setEnabled(true);
  }

  function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.033);
    const elapsedTime = clock.elapsedTime;
    stylizePass.uniforms.uTime.value = elapsedTime;

    if (playerController && characters) {
      playerController.update(deltaTime);
      characters.player.animator.update(deltaTime, elapsedTime, {
        moveAmount: mode === "explore" || mode === "transition" ? playerController.getMoveAmount() : 0,
      });

      const playerPosition = playerController.character.position;
      const voiceEntries = Object.entries(characters.voices);
      voiceEntries.forEach(([index, character], voiceIndex) => {
        character.animator.update(deltaTime, elapsedTime);
        updateNpcPresence(character.container, elapsedTime, 0.3 + voiceIndex * 0.65, playerPosition);
      });

      if (mode === "explore") {
        interactions.update(playerPosition);
        if (playerController.getMoveAmount() > 0.25) {
          audio.playFootstep(0.7 + playerController.getMoveAmount() * 0.5);
        }
      } else {
        ui.interactionPrompt.classList.add("hidden");
      }

      const pointerActive = document.pointerLockElement === renderer.domElement;
      ui.focusHint.classList.toggle("hidden", pointerActive || mode !== "explore");
    }

    environment.update(elapsedTime, stateManager.getSnapshot());
    composer.render();
  }

  function wireUi() {
    window.addEventListener("resize", setInternalResolution);
    setInternalResolution();

    app.addEventListener("click", async () => {
      await audio.unlock();
      if (playerController && mode === "explore") {
        playerController.requestPointerLock();
      }
    });

    window.addEventListener("keydown", (event) => {
      if (event.code === "KeyE" && mode === "explore") {
        interactions.interact();
      }

      if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code) && mode === "explore" && playerController) {
        playerController.requestPointerLock();
      }

      if (event.code === "Escape") {
        if (mode === "explore") {
          openPauseMenu();
        } else if (mode === "pause") {
          closePauseMenu();
        }
      }
    });

    ui.newGameButton.addEventListener("click", async () => {
      await audio.unlock();
      beginRun(false);
    });

    ui.continueButton.addEventListener("click", async () => {
      await audio.unlock();
      beginRun(true);
    });

    ui.resumeButton.addEventListener("click", () => closePauseMenu());
    ui.restartRunButton.addEventListener("click", async () => {
      await audio.unlock();
      beginRun(false);
    });
    ui.returnTitleButton.addEventListener("click", () => showTitleScreen());
    ui.restartButton.addEventListener("click", async () => {
      await audio.unlock();
      beginRun(false);
    });
    ui.endingReturnButton.addEventListener("click", () => showTitleScreen());
  }

  async function init() {
    try {
      characters = await buildCharacters();
      playerController = new PlayerController(characters.player.container, camera, renderer.domElement);
      groundColliders = environment.getGroundMeshes();
      playerController.setColliders(groundColliders);
      const snapshot = stateManager.load();
      playerController.setBounds(environment.getBounds(snapshot.currentChamber));
      playerController.teleport(environment.getSpawn(snapshot.currentChamber), Math.PI);
      registerInteractions();
      syncWorld(snapshot);
      wireUi();
      showTitleScreen();
    } catch (error) {
      ui.focusHint.classList.remove("hidden");
      ui.focusHint.innerHTML = "<p>Model load failed.</p><p>Check that a_man_in_suit.glb remains in the project root.</p>";
      console.error(error);
    }

    animate();
  }

  init();
}
