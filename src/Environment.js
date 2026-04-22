import * as THREE from "three";
import { CHAMBER_DEFINITIONS } from "./data/chambers.js";

function makeMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 1,
    metalness: options.metalness ?? 0.04,
    flatShading: options.flatShading ?? true,
    emissive: options.emissive ?? color,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function makeFloor(radiusTop, radiusBottom, height, sides, color) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides),
    makeMaterial(color, { roughness: 1, metalness: 0.08 })
  );
  mesh.receiveShadow = true;
  return mesh;
}

function makePillar(height, color) {
  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.7, height, 6),
    makeMaterial(color, { roughness: 1, metalness: 0.02 })
  );
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  return pillar;
}

function makeSlab(width, height, depth, color) {
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    makeMaterial(color, { roughness: 1, metalness: 0.03 })
  );
  slab.castShadow = true;
  slab.receiveShadow = true;
  return slab;
}

function makePulseMesh(geometry, color, emissiveIntensity = 0.28) {
  const mesh = new THREE.Mesh(
    geometry,
    makeMaterial(color, {
      emissive: color,
      emissiveIntensity,
      roughness: 0.92,
      metalness: 0.06,
    })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function prioritizeInteractiveVisual(object, renderOrder = 8) {
  object.renderOrder = renderOrder;
  object.traverse?.((node) => {
    if (!node.isMesh) {
      return;
    }

    node.renderOrder = renderOrder;
    const material = node.material;
    if (material && !Array.isArray(material)) {
      material.polygonOffset = true;
      material.polygonOffsetFactor = -1;
      material.polygonOffsetUnits = -2;
    }
  });
}

function addFloatingForms(group, palette, center = new THREE.Vector3()) {
  const forms = [];

  for (let index = 0; index < 9; index += 1) {
    const geometry = index % 2 === 0
      ? new THREE.OctahedronGeometry(0.45 + Math.random() * 0.35, 0)
      : new THREE.TetrahedronGeometry(0.5 + Math.random() * 0.25, 0);
    const mesh = makePulseMesh(geometry, palette[index % palette.length], 0.08);
    const angle = (index / 9) * Math.PI * 2;
    const radius = 5.5 + (index % 3) * 1.6;
    mesh.position.set(center.x + Math.cos(angle) * radius, center.y + 2.4 + (index % 4) * 0.7, center.z + Math.sin(angle) * radius);
    mesh.userData.baseY = mesh.position.y;
    mesh.userData.floatSpeed = 0.4 + index * 0.05;
    mesh.userData.floatPhase = index * 0.7;
    forms.push(mesh);
    group.add(mesh);
  }

  return forms;
}

function arrayToVector3(values) {
  return new THREE.Vector3(values[0], values[1], values[2]);
}

function localFromWorld(chamberDefinition, worldPosition) {
  const origin = arrayToVector3(chamberDefinition.origin);
  return arrayToVector3(worldPosition).sub(origin);
}

function tintByDominant(colorHex, dominantArchetype) {
  const base = new THREE.Color(colorHex);
  const tintPalette = {
    avenger: new THREE.Color("#d38466"),
    philosopher: new THREE.Color("#9db9de"),
    actor: new THREE.Color("#bf8fd8"),
    fatalist: new THREE.Color("#a9d0d2"),
    fractured: new THREE.Color("#d7c7b7"),
  };

  return base.lerp(tintPalette[dominantArchetype] ?? tintPalette.fractured, 0.18);
}

export class EnvironmentController {
  constructor(scene) {
    this.scene = scene;
    this.floaters = [];
    this.pulseMeshes = [];
    this.groups = new Map();
    this.interactiveObjects = {
      transitions: {},
      fragments: {},
      stageMarks: {},
      judgmentPlates: {},
      finalDais: null,
    };

    this.buildChambers();
    this.setMood("start", "fractured");
  }

  registerPulseMesh(mesh, options = {}) {
    mesh.userData.pulseSpeed = options.speed ?? 1.1;
    mesh.userData.pulsePhase = options.phase ?? Math.random() * Math.PI * 2;
    mesh.userData.baseScale = mesh.scale.clone();
    mesh.userData.baseEmissiveIntensity = mesh.material.emissiveIntensity ?? 0.2;
    this.pulseMeshes.push(mesh);
    return mesh;
  }

  createTransitionSigil(worldPosition, color) {
    const group = new THREE.Group();
    group.position.copy(worldPosition);
    group.position.y += 0.16;

    const ring = this.registerPulseMesh(
      makePulseMesh(new THREE.TorusGeometry(1.35, 0.18, 8, 20), color, 0.34),
      { speed: 1.6 }
    );
    ring.rotation.x = Math.PI / 2;

    const disc = this.registerPulseMesh(
      makePulseMesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 8), color, 0.16),
      { speed: 0.9, phase: 0.7 }
    );
    disc.position.y = 0.02;

    group.add(ring, disc);
    prioritizeInteractiveVisual(group, 9);
    return group;
  }

  createFragment(worldPosition, color) {
    const fragment = this.registerPulseMesh(
      makePulseMesh(new THREE.OctahedronGeometry(0.42, 0), color, 0.28),
      { speed: 1.3 }
    );
    fragment.position.copy(worldPosition);
    fragment.userData.baseY = fragment.position.y;
    return fragment;
  }

  createStageMark(worldPosition, color) {
    const mark = this.registerPulseMesh(
      makePulseMesh(new THREE.TorusGeometry(1.05, 0.12, 6, 16), color, 0.2),
      { speed: 1.25 }
    );
    mark.position.copy(worldPosition);
    mark.position.y += 0.24;
    mark.rotation.x = Math.PI / 2;
    prioritizeInteractiveVisual(mark, 10);
    return mark;
  }

  createJudgmentPlate(worldPosition, color) {
    const plate = this.registerPulseMesh(
      makePulseMesh(new THREE.CylinderGeometry(1.15, 1.35, 0.24, 6), color, 0.24),
      { speed: 0.85 }
    );
    plate.position.copy(worldPosition);
    plate.position.y += 0.16;
    prioritizeInteractiveVisual(plate, 10);
    return plate;
  }

  createFinalDais(worldPosition) {
    const group = new THREE.Group();
    group.position.copy(worldPosition);

    const dais = makeFloor(2.8, 3.4, 0.38, 10, "#e7d5bc");
    dais.position.y = 0.1;
    group.add(dais);

    const ring = this.registerPulseMesh(
      makePulseMesh(new THREE.TorusGeometry(3.5, 0.16, 8, 24), "#d5b088", 0.24),
      { speed: 0.7 }
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.18;
    group.add(ring);

    return group;
  }

  buildChambers() {
    this.buildStartChamber();
    this.buildDebateChamber();
    this.buildHallOfDelay();
    this.buildStageOfMasks();
    this.buildConsequenceChamber();

    for (const group of this.groups.values()) {
      this.scene.add(group);
    }
  }

  buildStartChamber() {
    const definition = CHAMBER_DEFINITIONS.start;
    const group = new THREE.Group();
    group.position.copy(arrayToVector3(definition.origin));

    const floor = makeFloor(10.5, 12.5, 0.8, 8, "#7f948d");
    floor.position.y = -0.4;
    const innerFloor = makeFloor(4.6, 5.4, 0.35, 8, "#d2c7ae");
    innerFloor.position.y = -0.05;
    group.add(floor, innerFloor);

    for (let index = 0; index < 6; index += 1) {
      const angle = (index / 6) * Math.PI * 2;
      const pillar = makePillar(5.6 + (index % 2) * 0.8, index % 2 === 0 ? "#5c847d" : "#c7b482");
      pillar.position.set(Math.cos(angle) * 8.3, pillar.geometry.parameters.height / 2, Math.sin(angle) * 8.3);
      group.add(pillar);
    }

    const archLeft = makeSlab(1.1, 5.2, 1.1, "#c7b482");
    archLeft.position.set(0.9, 2.6, -7.5);
    const archRight = archLeft.clone();
    archRight.position.x = -0.9;
    const archTop = makeSlab(3.6, 0.8, 1.1, "#e1d7b8");
    archTop.position.set(0, 4.8, -7.5);
    group.add(archLeft, archRight, archTop);

    for (let index = 0; index < 4; index += 1) {
      const slab = makeSlab(3, 2.8, 0.7, index % 2 === 0 ? "#51696d" : "#909a91");
      slab.position.set(-8.4 + index * 5.6, 1.4, 9.2);
      slab.rotation.y = (index - 1.5) * 0.12;
      group.add(slab);
    }

    const lightA = new THREE.PointLight("#9fd0cd", 28, 28, 2);
    lightA.position.set(-5.5, 6.5, 2.5);
    const lightB = new THREE.PointLight("#f5c982", 24, 26, 2);
    lightB.position.set(4.8, 5.6, -3.8);
    group.add(lightA, lightB);
    this.floaters.push(...addFloatingForms(group, ["#8ac6bf", "#d2c486", "#90a5c2"]));

    this.interactiveObjects.transitions.start = this.createTransitionSigil(
      localFromWorld(definition, definition.transitionAnchor),
      "#d8c49a"
    );
    group.add(this.interactiveObjects.transitions.start);
    this.groups.set(definition.id, group);
  }

  buildDebateChamber() {
    const definition = CHAMBER_DEFINITIONS.debate;
    const group = new THREE.Group();
    group.position.copy(arrayToVector3(definition.origin));

    const floor = makeFloor(8.6, 10.3, 0.9, 10, "#8b735b");
    floor.position.y = -0.45;
    const stage = makeFloor(3.1, 3.8, 0.45, 10, "#e0ccb0");
    stage.position.y = 0.05;
    group.add(floor, stage);

    const ring = this.registerPulseMesh(
      makePulseMesh(new THREE.TorusGeometry(4.8, 0.25, 6, 18), "#b8554f", 0.32),
      { speed: 0.8 }
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    group.add(ring);

    for (let index = 0; index < 5; index += 1) {
      const angle = (index / 5) * Math.PI * 2 + 0.3;
      const pillar = makePillar(6.5 + (index % 2) * 1.2, index % 2 === 0 ? "#803834" : "#d3aa72");
      pillar.position.set(Math.cos(angle) * 6.9, pillar.geometry.parameters.height / 2, Math.sin(angle) * 6.9);
      group.add(pillar);
    }

    for (let index = 0; index < 4; index += 1) {
      const slab = makeSlab(3.2, 5, 0.7, index % 2 === 0 ? "#412124" : "#8a644b");
      slab.position.set(-6 + index * 4, 2.5, -9.3);
      slab.rotation.y = -0.25 + index * 0.17;
      group.add(slab);
    }

    const lightA = new THREE.SpotLight("#ffcf8b", 32, 28, 0.42, 0.5, 1.1);
    lightA.position.set(0, 12, 2);
    lightA.target.position.set(0, 0, 0);
    const lightB = new THREE.PointLight("#c85d58", 20, 20, 2);
    lightB.position.set(-3.8, 4.6, -2.5);
    const lightC = new THREE.PointLight("#a06bc2", 12, 16, 2);
    lightC.position.set(3.6, 5.4, 2.8);
    group.add(lightA, lightA.target, lightB, lightC);

    this.floaters.push(...addFloatingForms(group, ["#d18372", "#efc082", "#8369b9"]));
    this.interactiveObjects.transitions.debate = this.createTransitionSigil(
      localFromWorld(definition, definition.transitionAnchor),
      "#d88a76"
    );
    group.add(this.interactiveObjects.transitions.debate);
    this.groups.set(definition.id, group);
  }

  buildHallOfDelay() {
    const definition = CHAMBER_DEFINITIONS.hallOfDelay;
    const group = new THREE.Group();
    group.position.copy(arrayToVector3(definition.origin));

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.9, 32),
      makeMaterial("#8c9aa4", { roughness: 1, metalness: 0.03 })
    );
    floor.position.set(0, -0.45, -3);
    floor.receiveShadow = true;
    group.add(floor);

    const innerPath = new THREE.Mesh(
      new THREE.BoxGeometry(5.2, 0.18, 28),
      makeMaterial("#d9d6c8", { roughness: 1, metalness: 0.02 })
    );
    innerPath.position.set(0, 0.02, -3);
    innerPath.receiveShadow = true;
    group.add(innerPath);

    for (let index = 0; index < 7; index += 1) {
      const z = 8 - index * 4.1;
      const leftPillar = makeSlab(0.65, 5.2, 0.8, index % 2 === 0 ? "#6d7e89" : "#c9bda2");
      const rightPillar = leftPillar.clone();
      leftPillar.position.set(-2.8, 2.6, z);
      rightPillar.position.set(2.8, 2.6, z);
      const topBeam = makeSlab(6.5, 0.55, 0.8, "#cfc4ad");
      topBeam.position.set(0, 4.95, z);
      group.add(leftPillar, rightPillar, topBeam);
    }

    const horizonRing = this.registerPulseMesh(
      makePulseMesh(new THREE.TorusGeometry(1.8, 0.16, 8, 24), "#cfdce7", 0.25),
      { speed: 0.7 }
    );
    horizonRing.position.set(0, 2.1, -16.5);
    group.add(horizonRing);

    const longLight = new THREE.PointLight("#d6e5f0", 22, 40, 2);
    longLight.position.set(0, 6.8, 0);
    group.add(longLight);

    this.floaters.push(...addFloatingForms(group, ["#b2cedf", "#d9d2bc", "#93a8bc"], new THREE.Vector3(0, 0, -3)));

    for (const [fragmentId, position] of Object.entries(definition.fragments)) {
      this.interactiveObjects.fragments[fragmentId] = this.createFragment(localFromWorld(definition, position), "#dce8ef");
      group.add(this.interactiveObjects.fragments[fragmentId]);
    }

    this.interactiveObjects.transitions.hallOfDelay = this.createTransitionSigil(
      localFromWorld(definition, definition.transitionAnchor),
      "#b8ceda"
    );
    group.add(this.interactiveObjects.transitions.hallOfDelay);
    this.groups.set(definition.id, group);
  }

  buildStageOfMasks() {
    const definition = CHAMBER_DEFINITIONS.stageOfMasks;
    const group = new THREE.Group();
    group.position.copy(arrayToVector3(definition.origin));

    const floor = makeFloor(9.2, 10.6, 0.8, 12, "#7e6579");
    floor.position.y = -0.42;
    group.add(floor);

    const stage = new THREE.Mesh(
      new THREE.BoxGeometry(9.5, 0.42, 7.5),
      makeMaterial("#dcc5aa", { roughness: 0.95, metalness: 0.04 })
    );
    stage.position.set(0, 0.18, -1.6);
    stage.receiveShadow = true;
    stage.castShadow = true;
    group.add(stage);

    for (let index = 0; index < 5; index += 1) {
      const frame = makeSlab(2.2 + (index % 2) * 0.8, 3.8 + (index % 3) * 0.6, 0.25, index % 2 === 0 ? "#ccaf8d" : "#563e58");
      frame.position.set(-6 + index * 3, 4.4 + (index % 2) * 0.5, -3.4 + (index % 3) * 1.7);
      frame.rotation.z = -0.08 + index * 0.04;
      group.add(frame);
    }

    for (let index = 0; index < 3; index += 1) {
      const light = new THREE.SpotLight(index === 1 ? "#fff1cb" : "#d9a8ff", index === 1 ? 34 : 18, 24, 0.46, 0.45, 1);
      light.position.set(-4 + index * 4, 10, -1 + index * 1.2);
      light.target.position.set(-3 + index * 3, 0, -2.5 + index * 0.8);
      group.add(light, light.target);
    }

    const backdrop = makeSlab(12, 8, 0.7, "#442f44");
    backdrop.position.set(0, 4, -9.2);
    group.add(backdrop);

    this.floaters.push(...addFloatingForms(group, ["#d7b792", "#c89ce1", "#7c6886"], new THREE.Vector3(0, 0, -1.5)));

    for (const [markId, position] of Object.entries(definition.stageMarks)) {
      this.interactiveObjects.stageMarks[markId] = this.createStageMark(localFromWorld(definition, position), "#f1c995");
      group.add(this.interactiveObjects.stageMarks[markId]);
    }

    this.interactiveObjects.transitions.stageOfMasks = this.createTransitionSigil(
      localFromWorld(definition, definition.transitionAnchor),
      "#d3b4d8"
    );
    group.add(this.interactiveObjects.transitions.stageOfMasks);
    this.groups.set(definition.id, group);
  }

  buildConsequenceChamber() {
    const definition = CHAMBER_DEFINITIONS.consequence;
    const group = new THREE.Group();
    group.position.copy(arrayToVector3(definition.origin));

    for (let index = 0; index < 7; index += 1) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 0.36, 4.2),
        makeMaterial(index % 2 === 0 ? "#8b736a" : "#d2bea9", { roughness: 1, metalness: 0.04 })
      );
      tile.position.set(-6 + (index % 3) * 6, -0.18, -6 + Math.floor(index / 3) * 6);
      tile.rotation.z = (index - 3) * 0.05;
      tile.rotation.x = (index % 2 === 0 ? 1 : -1) * 0.03;
      tile.castShadow = true;
      tile.receiveShadow = true;
      group.add(tile);
    }

    const centralRing = this.registerPulseMesh(
      makePulseMesh(new THREE.TorusGeometry(5.5, 0.22, 8, 28), "#c98267", 0.24),
      { speed: 0.9 }
    );
    centralRing.rotation.x = Math.PI / 2;
    centralRing.position.set(0, 0.22, -0.4);
    group.add(centralRing);

    for (let index = 0; index < 4; index += 1) {
      const pillar = makePillar(7.1 + (index % 2) * 0.8, index % 2 === 0 ? "#78544d" : "#ceb18f");
      pillar.position.set(index < 2 ? -7.2 : 7.2, pillar.geometry.parameters.height / 2, index % 2 === 0 ? -7.1 : 7.1);
      group.add(pillar);
    }

    const hardLight = new THREE.PointLight("#ffc696", 24, 24, 2);
    hardLight.position.set(0, 7.8, -1);
    const coldLight = new THREE.PointLight("#b7d2e7", 18, 24, 2);
    coldLight.position.set(0, 5.5, 6.2);
    group.add(hardLight, coldLight);

    for (const [plateId, position] of Object.entries(definition.judgmentPlates)) {
      this.interactiveObjects.judgmentPlates[plateId] = this.createJudgmentPlate(localFromWorld(definition, position), "#e5cfab");
      group.add(this.interactiveObjects.judgmentPlates[plateId]);
    }

    this.interactiveObjects.finalDais = this.createFinalDais(localFromWorld(definition, definition.finalAnchor));
    group.add(this.interactiveObjects.finalDais);
    this.groups.set(definition.id, group);
  }

  getSpawn(chamberId) {
    return arrayToVector3(CHAMBER_DEFINITIONS[chamberId].spawn);
  }

  getBounds(chamberId) {
    return CHAMBER_DEFINITIONS[chamberId].bounds;
  }

  getChamberDefinition(chamberId) {
    return CHAMBER_DEFINITIONS[chamberId];
  }

  getNpcPosition(chamberId, archetype) {
    return arrayToVector3(CHAMBER_DEFINITIONS[chamberId].npcAnchors[archetype]);
  }

  getTransitionObject(chamberId) {
    return this.interactiveObjects.transitions[chamberId];
  }

  getFragmentObject(fragmentId) {
    return this.interactiveObjects.fragments[fragmentId];
  }

  getStageMarkObject(markId) {
    return this.interactiveObjects.stageMarks[markId];
  }

  getJudgmentPlateObject(plateId) {
    return this.interactiveObjects.judgmentPlates[plateId];
  }

  getFinalDaisObject() {
    return this.interactiveObjects.finalDais;
  }

  setMood(chamberId, dominantArchetype = "fractured") {
    const chamber = CHAMBER_DEFINITIONS[chamberId];
    const background = tintByDominant(chamber.mood.background, dominantArchetype);
    const fog = tintByDominant(chamber.mood.fog, dominantArchetype);
    this.scene.background = background;

    if (!this.scene.fog) {
      this.scene.fog = new THREE.FogExp2(fog, chamber.mood.fogDensity);
    }

    this.scene.fog.color.copy(fog);
    this.scene.fog.density = chamber.mood.fogDensity;

    return {
      ...chamber.mood,
      background,
      fog,
    };
  }

  applyProgressState(snapshot) {
    const completed = snapshot.completedEncounters ?? [];

    if (this.interactiveObjects.transitions.start) {
      this.interactiveObjects.transitions.start.visible = completed.includes("philosopherIntro");
    }

    if (this.interactiveObjects.transitions.debate) {
      this.interactiveObjects.transitions.debate.visible = completed.includes("avengerDebate");
    }

    if (this.interactiveObjects.transitions.hallOfDelay) {
      this.interactiveObjects.transitions.hallOfDelay.visible = completed.includes("witnessDelay");
    }

    if (this.interactiveObjects.transitions.stageOfMasks) {
      this.interactiveObjects.transitions.stageOfMasks.visible = completed.includes("actorMasks");
    }

    for (const [fragmentId, fragment] of Object.entries(this.interactiveObjects.fragments)) {
      fragment.visible = !snapshot.collectedFragments.includes(fragmentId);
    }

    for (const [markId, mark] of Object.entries(this.interactiveObjects.stageMarks)) {
      const activated = snapshot.activatedStageMarks.includes(markId);
      mark.material.emissiveIntensity = activated ? 0.5 : 0.18;
      mark.scale.setScalar(activated ? 1.06 : 1);
    }

    for (const [plateId, plate] of Object.entries(this.interactiveObjects.judgmentPlates)) {
      const activated = snapshot.activatedJudgmentPlates.includes(plateId);
      plate.material.emissiveIntensity = activated ? 0.56 : 0.2;
      plate.scale.setScalar(activated ? 1.08 : 1);
    }

    if (this.interactiveObjects.finalDais) {
      const allPlatesActive = snapshot.activatedJudgmentPlates.length >= 3;
      const pulseRing = this.interactiveObjects.finalDais.children[1];

      if (pulseRing?.material) {
        pulseRing.material.emissiveIntensity = allPlatesActive ? 0.42 : 0.18;
      }
    }
  }

  update(time, snapshot) {
    for (const floater of this.floaters) {
      floater.position.y = floater.userData.baseY + Math.sin(time * floater.userData.floatSpeed + floater.userData.floatPhase) * 0.25;
      floater.rotation.x += 0.002;
      floater.rotation.y += 0.003;
    }

    for (const mesh of this.pulseMeshes) {
      const pulse = 1 + Math.sin(time * mesh.userData.pulseSpeed + mesh.userData.pulsePhase) * 0.04;
      mesh.scale.copy(mesh.userData.baseScale).multiplyScalar(pulse);
      if (mesh.material) {
        mesh.material.emissiveIntensity = mesh.userData.baseEmissiveIntensity + Math.sin(time * mesh.userData.pulseSpeed + mesh.userData.pulsePhase) * 0.05;
      }
      if (mesh.userData.baseY !== undefined) {
        mesh.position.y = mesh.userData.baseY + Math.sin(time * 0.8 + mesh.userData.pulsePhase) * 0.08;
      }
    }

    const dominant = snapshot?.dominantArchetype ?? "fractured";
    const intensity = dominant === "avenger" ? 0.035 : dominant === "actor" ? 0.03 : 0.024;

    for (const [chamberId, group] of this.groups) {
      if (chamberId === "hallOfDelay") {
        group.position.y = Math.sin(time * 0.45) * 0.12;
      } else if (chamberId === "stageOfMasks") {
        group.rotation.y = Math.sin(time * 0.22) * 0.03;
      } else if (chamberId === "consequence") {
        group.rotation.y = Math.sin(time * 0.18) * intensity;
      } else {
        group.rotation.y = Math.sin(time * 0.1) * 0.012;
      }
    }
  }
}
