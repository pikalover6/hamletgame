import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { CharacterRigAnimator } from "../CharacterAnimator.js";

const loader = new GLTFLoader();

export const CHARACTER_VARIANTS = {
  player: {
    appearance: {},
    animation: {
      idleStrength: 0.9,
      walkStrength: 1,
      presenceStrength: 0.84,
      phase: 0,
      shoulderWidth: 0.045, // Reduced from default 0.085 to make shoulders less broad
    },
    height: 2.95,
    scale: 1.02,
  },
  philosopher: {
    appearance: {
      outfitTint: "#8794a8",
      outfitBlend: 0.12,
      presenceColor: "#9cb7de",
      presenceIntensity: 2.2,
    },
    animation: {
      idleStrength: 1,
      walkStrength: 0.6,
      presenceStrength: 0.72,
      phase: 1.1,
    },
    height: 2.9,
    scale: 0.98,
  },
  avenger: {
    appearance: {
      outfitTint: "#8f6259",
      outfitBlend: 0.14,
      presenceColor: "#d8896f",
      presenceIntensity: 2.6,
    },
    animation: {
      idleStrength: 0.82,
      walkStrength: 0.7,
      presenceStrength: 1.05,
      phase: 2.3,
    },
    height: 3.05,
    scale: 1.05,
  },
  actor: {
    appearance: {
      outfitTint: "#8f6f95",
      outfitBlend: 0.18,
      presenceColor: "#d4a6ea",
      presenceIntensity: 2.4,
    },
    animation: {
      idleStrength: 0.92,
      walkStrength: 0.55,
      presenceStrength: 1.08,
      phase: 3.2,
    },
    height: 2.96,
    scale: 1.0,
  },
  witness: {
    appearance: {
      outfitTint: "#6f8a8f",
      outfitBlend: 0.12,
      presenceColor: "#b7d7d8",
      presenceIntensity: 1.9,
    },
    animation: {
      idleStrength: 0.72,
      walkStrength: 0.45,
      presenceStrength: 0.92,
      phase: 4.1,
    },
    height: 2.88,
    scale: 0.96,
  },
};

function prepareCharacterMaterials(root, appearance = {}) {
  const outfitTint = appearance.outfitTint ? new THREE.Color(appearance.outfitTint) : null;
  const outfitBlend = appearance.outfitBlend ?? 0;
  const emissiveColor = appearance.presenceColor ? new THREE.Color(appearance.presenceColor) : null;

  root.traverse((node) => {
    if (!node.isMesh) {
      return;
    }

    node.castShadow = true;
    node.receiveShadow = true;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    const clonedMaterials = materials.map((material) => {
      const nextMaterial = material.clone();

      if (outfitTint && nextMaterial.name === "outfit") {
        nextMaterial.color = nextMaterial.color.clone().lerp(outfitTint, outfitBlend);
      }

      if (emissiveColor && nextMaterial.name === "outfit") {
        nextMaterial.emissive = emissiveColor.clone();
        nextMaterial.emissiveIntensity = 0.08;
      }

      return nextMaterial;
    });

    node.material = Array.isArray(node.material) ? clonedMaterials : clonedMaterials[0];
  });
}

function addPresenceLight(container, appearance = {}) {
  if (!appearance.presenceColor || !appearance.presenceIntensity) {
    return;
  }

  const presenceLight = new THREE.PointLight(appearance.presenceColor, appearance.presenceIntensity, 6, 2);
  presenceLight.position.set(0, 2.5, 0.35);
  container.add(presenceLight);
}

function centerCharacter(root, desiredHeight) {
  const bounds = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const scale = desiredHeight / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);

  const rescaledBounds = new THREE.Box3().setFromObject(root);
  const center = rescaledBounds.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= rescaledBounds.min.y;
}

export async function loadBaseCharacterAssets() {
  const suitUrl = new URL("../../a_man_in_suit.glb", import.meta.url).href;
  const gltf = await loader.loadAsync(suitUrl);

  let walkClip = null;
  let idleClip = null;

  const fbxLoader = new FBXLoader();

  try {
    const walkUrl = new URL("../../walk.fbx", import.meta.url).href;
    const walkFbx = await fbxLoader.loadAsync(walkUrl);
    if (walkFbx.animations.length > 0) {
      [walkClip] = walkFbx.animations;
    }
  } catch (error) {
    console.warn("[CharacterFactory] walk.fbx was not available; using procedural locomotion fallback.", error);
  }

  try {
    const idleUrl = new URL("../../idle.fbx", import.meta.url).href;
    const idleFbx = await fbxLoader.loadAsync(idleUrl);
    if (idleFbx.animations.length > 0) {
      [idleClip] = idleFbx.animations;
    }
  } catch (error) {
    console.warn("[CharacterFactory] idle.fbx was not available.", error);
  }

  return {
    baseScene: gltf.scene,
    walkClip,
    idleClip,
  };
}

export function createCharacter(baseScene, definition) {
  const instance = clone(baseScene);
  prepareCharacterMaterials(instance, definition.appearance);
  centerCharacter(instance, definition.height * (definition.scale ?? 1));

  const container = new THREE.Group();
  container.add(instance);
  addPresenceLight(container, definition.appearance);

  return {
    container,
    animator: new CharacterRigAnimator(instance, definition.animation),
  };
}