import * as THREE from "three";

/**
 * Remap animation tracks from Mixamo bone names ("Hips", "mixamorigLeftArm", …)
 * to this model's bone names ("Hips_01", "LeftArm_013", …).
 * The mapping is derived automatically by stripping the trailing _NN suffix
 * and the optional "mixamorig" prefix from each bone in the skeleton.
 */
function remapMixamoClip(clip, root) {
  // Build a lookup: canonical bone base name → actual bone name in this model.
  // Handles both "Hips_01" style and plain "Hips" style models.
  const nameMap = new Map();
  root.traverse((obj) => {
    if (obj.isBone || obj.type === "Bone") {
      // Strip numeric suffix (_01, _063, …) and mixamorig prefix
      const base = obj.name.replace(/_\d+$/, "").replace(/^mixamorig/i, "");
      nameMap.set(base.toLowerCase(), obj.name);
    }
  });

  const tracks = [];
  for (const track of clip.tracks) {
    const dot = track.name.indexOf(".");
    if (dot === -1) continue;

    const raw  = track.name.slice(0, dot);
    const prop = track.name.slice(dot); // e.g. ".quaternion"

    // Strip pipe-separated armature prefix (e.g. "Armature|mixamorigHips")
    const rawClean = raw.includes("|") ? raw.split("|").pop() : raw;
    const base     = rawClean.replace(/^mixamorig/i, "").toLowerCase();

    const mapped = nameMap.get(base);
    if (!mapped) continue; // discard unmappable tracks

    // Keep only rotation tracks — drop position/scale to prevent root motion
    // overriding the character controller's world-space movement.
    if (!prop.includes("quaternion") && !prop.includes("rotation")) continue;

    const t  = track.clone();
    t.name   = mapped + prop;
    tracks.push(t);
  }

  console.log(
    `[CharacterAnimator] walk clip remapped: ${tracks.length}/${clip.tracks.length} tracks kept`,
    tracks.slice(0, 4).map((t) => t.name)
  );

  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

export class CharacterRigAnimator {
  constructor(root, options = {}) {
    this.root = root;
    this.phase = options.phase ?? Math.random() * Math.PI * 2;
    this.walkStrength = options.walkStrength ?? 1;
    this.moveBlend = 0;
    this.mixer = null;
    this.walkAction = null;
    this.idleAction = null;
  }

  loadWalkClip(clip) {
    const remapped = remapMixamoClip(clip, this.root);
    if (remapped.tracks.length === 0) {
      console.warn("[CharacterAnimator] walk clip remapping produced 0 tracks — bone names did not match.");
      return;
    }
    if (!this.mixer) {
      this.mixer = new THREE.AnimationMixer(this.root);
    }
    this.walkAction = this.mixer.clipAction(remapped);
    this.walkAction.setLoop(THREE.LoopRepeat);
    this.walkAction.play();
  }

  loadIdleClip(clip) {
    const remapped = remapMixamoClip(clip, this.root);
    if (remapped.tracks.length === 0) {
      console.warn("[CharacterAnimator] idle clip remapping produced 0 tracks — bone names did not match.");
      return;
    }
    if (!this.mixer) {
      this.mixer = new THREE.AnimationMixer(this.root);
    }
    this.idleAction = this.mixer.clipAction(remapped);
    this.idleAction.setLoop(THREE.LoopRepeat);
    this.idleAction.play();
  }

  update(deltaTime, elapsedTime, { moveAmount = 0 } = {}) {
    this.moveBlend = THREE.MathUtils.damp(this.moveBlend, moveAmount, 10, deltaTime);
    const w = this.moveBlend;

    if (this.mixer) {
      if (this.walkAction) {
        this.walkAction.setEffectiveWeight(w);
        this.walkAction.setEffectiveTimeScale(w);
      }
      if (this.idleAction) {
        this.idleAction.setEffectiveWeight(1 - w);
        this.idleAction.setEffectiveTimeScale(1);
      }
      this.mixer.update(deltaTime);
    }
  }
}
