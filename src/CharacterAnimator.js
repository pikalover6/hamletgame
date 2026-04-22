import * as THREE from "three";

const scratchEuler = new THREE.Euler();
const scratchQuaternion = new THREE.Quaternion();

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

function storeTransform(map, bone) {
  if (!bone) {
    return;
  }

  map.set(bone.name, {
    position: bone.position.clone(),
    quaternion: bone.quaternion.clone(),
  });
}

export class CharacterRigAnimator {
  constructor(root, options = {}) {
    this.root = root;
    this.phase = options.phase ?? Math.random() * Math.PI * 2;
    this.idleStrength = options.idleStrength ?? 1;
    this.walkStrength = options.walkStrength ?? 1;
    this.presenceStrength = options.presenceStrength ?? 1;
    this.shoulderWidth = options.shoulderWidth ?? 0.085;
    this.moveBlend = 0;
    this.walkCycle = this.phase; // used by procedural fallback
    this.walkCadence = 0;       // used by procedural fallback
    this.mixer = null;
    this.walkAction = null;
    this.restAction = null;
    this.bindPose = new Map();
    this.bones = {
      hips: root.getObjectByName("Hips_01"),
      spine: root.getObjectByName("Spine_02"),
      chest: root.getObjectByName("Spine2_04"),
      neck: root.getObjectByName("Neck2_07"),
      head: root.getObjectByName("Head_08"),
      leftShoulder: root.getObjectByName("LeftShoulder_012"),
      leftArm: root.getObjectByName("LeftArm_013"),
      leftForeArm: root.getObjectByName("LeftForeArm_014"),
      leftHand: root.getObjectByName("LeftHand_017"),
      rightShoulder: root.getObjectByName("RightShoulder_038"),
      rightArm: root.getObjectByName("RightArm_039"),
      rightForeArm: root.getObjectByName("RightForeArm_040"),
      rightHand: root.getObjectByName("RightHand_043"),
      leftUpLeg: root.getObjectByName("LeftUpLeg_063"),
      leftLeg: root.getObjectByName("LeftLeg_064"),
      leftFoot: root.getObjectByName("LeftFoot_065"),
      rightUpLeg: root.getObjectByName("RightUpLeg_068"),
      rightLeg: root.getObjectByName("RightLeg_069"),
      rightFoot: root.getObjectByName("RightFoot_070"),
    };

    for (const bone of Object.values(this.bones)) {
      storeTransform(this.bindPose, bone);
    }
  }

  /**
   * Load a walk AnimationClip (e.g. from a Mixamo GLB downloaded as
   * "Walking In Place"). Call once after construction.
   */
  loadWalkClip(clip) {
    const remapped = remapMixamoClip(clip, this.root);
    if (remapped.tracks.length === 0) {
      console.warn("[CharacterAnimator] remapping produced 0 tracks — bone names did not match. Falling back to procedural.");
      return;
    }

    this.mixer = new THREE.AnimationMixer(this.root);
    this.walkAction = this.mixer.clipAction(remapped);
    this.walkAction.setLoop(THREE.LoopRepeat);
    this.walkAction.setEffectiveWeight(1);
    this.walkAction.play();
  }

  applyRotation(bone, x = 0, y = 0, z = 0) {
    if (!bone) {
      return;
    }

    const bindPose = this.bindPose.get(bone.name);
    scratchEuler.set(x, y, z, "XYZ");
    scratchQuaternion.setFromEuler(scratchEuler);
    bone.quaternion.copy(bindPose.quaternion).multiply(scratchQuaternion);
  }

  applyVerticalOffset(bone, offset) {
    if (!bone) {
      return;
    }

    const bindPose = this.bindPose.get(bone.name);
    bone.position.copy(bindPose.position);
    bone.position.y += offset;
  }

  applyPositionOffset(bone, x = 0, y = 0, z = 0) {
    if (!bone) {
      return;
    }

    const bindPose = this.bindPose.get(bone.name);
    bone.position.copy(bindPose.position);
    bone.position.x += x;
    bone.position.y += y;
    bone.position.z += z;
  }

  blendTowardsBind(bone, weight) {
    if (!bone || weight <= 0) {
      return;
    }

    const bindPose = this.bindPose.get(bone.name);
    bone.quaternion.slerp(bindPose.quaternion, THREE.MathUtils.clamp(weight, 0, 1));
    bone.position.lerp(bindPose.position, THREE.MathUtils.clamp(weight, 0, 1));
  }

  applyBlendedRotation(bone, weight, x = 0, y = 0, z = 0) {
    if (!bone || weight <= 0) {
      return;
    }

    const bindPose = this.bindPose.get(bone.name);
    scratchEuler.set(x, y, z, "XYZ");
    scratchQuaternion.setFromEuler(scratchEuler);
    const targetQuaternion = bindPose.quaternion.clone().multiply(scratchQuaternion);
    bone.quaternion.slerp(targetQuaternion, THREE.MathUtils.clamp(weight, 0, 1));
  }

  applyBlendedPositionOffset(bone, weight, x = 0, y = 0, z = 0) {
    if (!bone || weight <= 0) {
      return;
    }

    const bindPose = this.bindPose.get(bone.name);
    const targetPosition = bindPose.position.clone();
    targetPosition.x += x;
    targetPosition.y += y;
    targetPosition.z += z;
    bone.position.lerp(targetPosition, THREE.MathUtils.clamp(weight, 0, 1));
  }

  applyMixerIdleOverlay(elapsedTime, moveWeight) {
    const idleA = Math.sin(elapsedTime * 1.15 + this.phase);
    const idleB = Math.sin(elapsedTime * 2.05 + this.phase * 0.63);
    const idleWeight = THREE.MathUtils.smoothstep(1 - moveWeight, 0, 1);
    const torsoWeight = idleWeight * 0.72;
    const limbWeight = idleWeight * 0.64;
    const settleWeight = idleWeight * 0.38;
    const shoulderWeight = THREE.MathUtils.clamp(0.45 + idleWeight * 0.45, 0, 1);
    const shoulderSpread = this.shoulderWidth * (1.1 + idleWeight * 0.12);

    this.blendTowardsBind(this.bones.leftUpLeg, settleWeight);
    this.blendTowardsBind(this.bones.rightUpLeg, settleWeight);
    this.blendTowardsBind(this.bones.leftLeg, settleWeight);
    this.blendTowardsBind(this.bones.rightLeg, settleWeight);
    this.blendTowardsBind(this.bones.leftFoot, settleWeight);
    this.blendTowardsBind(this.bones.rightFoot, settleWeight);
    this.blendTowardsBind(this.bones.leftArm, settleWeight * 0.7);
    this.blendTowardsBind(this.bones.rightArm, settleWeight * 0.7);
    this.blendTowardsBind(this.bones.leftForeArm, settleWeight * 0.7);
    this.blendTowardsBind(this.bones.rightForeArm, settleWeight * 0.7);

    this.applyBlendedPositionOffset(
      this.bones.hips,
      torsoWeight,
      0.018 * this.presenceStrength * idleB,
      0.014 * this.idleStrength * idleB,
      0
    );
    this.applyBlendedPositionOffset(this.bones.leftShoulder, shoulderWeight, shoulderSpread, 0.004 * idleWeight, 0);
    this.applyBlendedPositionOffset(this.bones.rightShoulder, shoulderWeight, -shoulderSpread, 0.004 * idleWeight, 0);
    this.applyBlendedRotation(
      this.bones.spine,
      torsoWeight,
      -0.025 * this.presenceStrength * idleA,
      0.02 * this.presenceStrength * idleB,
      -0.012 * idleB
    );
    this.applyBlendedRotation(
      this.bones.chest,
      torsoWeight,
      0.02 * this.idleStrength * idleB,
      -0.024 * this.presenceStrength * idleA,
      0.018 * this.presenceStrength * idleA
    );
    this.applyBlendedRotation(
      this.bones.neck,
      torsoWeight,
      0.014 * this.idleStrength * idleA,
      0.018 * this.presenceStrength * idleB,
      0
    );
    this.applyBlendedRotation(
      this.bones.head,
      torsoWeight,
      -0.02 * this.idleStrength * idleB,
      -0.022 * this.presenceStrength * idleA,
      0.01 * idleA
    );
    this.applyBlendedRotation(
      this.bones.leftShoulder,
      limbWeight,
      1.33 + 0.025 * this.idleStrength * idleA,
      0,
      0.12 + 0.018 * idleB
    );
    this.applyBlendedRotation(
      this.bones.rightShoulder,
      limbWeight,
      1.33 - 0.025 * this.idleStrength * idleA,
      0,
      -0.12 - 0.018 * idleB
    );
    this.applyBlendedRotation(
      this.bones.leftArm,
      limbWeight,
      0.012 * idleA,
      0,
      -0.07 - 0.016 * idleB
    );
    this.applyBlendedRotation(
      this.bones.rightArm,
      limbWeight,
      -0.012 * idleA,
      0,
      0.07 + 0.016 * idleB
    );
    this.applyBlendedRotation(this.bones.leftForeArm, limbWeight, 0, 0, 0.16);
    this.applyBlendedRotation(this.bones.rightForeArm, limbWeight, 0, 0, -0.16);
    this.applyBlendedRotation(this.bones.leftHand, limbWeight, 0.01 * idleA, 0.012 * idleB, 0.014);
    this.applyBlendedRotation(this.bones.rightHand, limbWeight, -0.01 * idleA, -0.012 * idleB, -0.014);
  }

  update(deltaTime, elapsedTime, { moveAmount = 0 } = {}) {
    this.moveBlend = THREE.MathUtils.damp(this.moveBlend, moveAmount, 10, deltaTime);
    const w  = this.moveBlend;
    const ws = this.walkStrength;

    const idleA = Math.sin(elapsedTime * 1.2 + this.phase);
    const idleB = Math.sin(elapsedTime * 2.1 + this.phase * 0.63);

    // ── Mixer-driven path (Mixamo walk clip loaded) ────────────────────────
    if (this.mixer && this.walkAction) {
      // Scale time by moveBlend — animation slows to a freeze when stopped
      // and resumes seamlessly when walking again.
      this.mixer.update(deltaTime * w);
      this.applyMixerIdleOverlay(elapsedTime, w);
      return;
    }

    // ── Procedural fallback (no clip loaded) ───────────────────────────────
    this.walkCadence = THREE.MathUtils.damp(this.walkCadence, THREE.MathUtils.lerp(1.4, 7.2, w), 8, deltaTime);
    this.walkCycle += this.walkCadence * deltaTime;
    const t = this.walkCycle;

    // --- stride signals ---
    const leftStride    = Math.sin(t);
    const rightStride   = Math.sin(t + Math.PI);
    // swing phase: leg is behind and lifting (leftStride < 0 → leftRecovery peaks)
    const leftRecovery  = Math.max(0, -leftStride);
    const rightRecovery = Math.max(0, -rightStride);
    // stance loading: leg is forward and absorbing weight
    const leftLoad      = Math.max(0, leftStride);
    const rightLoad     = Math.max(0, rightStride);

    // --- knee flexion ---
    // swing flex (~0.72 rad peak) keeps foot clear of ground;
    // loading flex (~0.20 rad peak) is the mild dip at heel-strike
    const leftKneeFlex  = leftRecovery * 0.72 + leftLoad * 0.20;
    const rightKneeFlex = rightRecovery * 0.72 + rightLoad * 0.20;

    // --- foot roll ---
    // plantarflex on push-off, dorsiflex/toe-lift on swing entry
    const leftToeLift   = Math.max(0, -Math.sin(t + 0.55));
    const rightToeLift  = Math.max(0, -Math.sin(t + Math.PI + 0.55));

    // --- body rhythm ---
    const strideLift    = 0.5 - 0.5 * Math.cos(t * 2);
    const strideHeight  = Math.pow(strideLift, 1.35);   // smooth double-peak
    const bodySway      = Math.sin(t + Math.PI / 2);    // coronal pelvic tilt
    const hipYaw        = Math.sin(t);                  // transverse pelvic rotation
    const chestCounter  = Math.sin(t + Math.PI);        // thorax counter-rotates

    // --- arm signals (contralateral) ---
    const leftArmDrive   = Math.sign(rightStride) * Math.pow(Math.abs(rightStride), 0.85);
    const rightArmDrive  = Math.sign(leftStride)  * Math.pow(Math.abs(leftStride),  0.85);
    const leftElbowBend  = Math.max(0, rightStride) * 0.70 + leftRecovery  * 0.30;
    const rightElbowBend = Math.max(0, leftStride)  * 0.70 + rightRecovery * 0.30;

    // --- vertical / lateral displacement ---
    const idleLift    = 0.008 * this.idleStrength * idleB;
    const walkLift    = 0.032 * ws * w * strideHeight;
    const bodyDip     = -0.016 * ws * w * strideHeight;
    const hipSway     = 0.045 * ws * w * bodySway;
    const shoulderSway = -hipSway * 0.50;

    // hips
    this.applyPositionOffset(this.bones.hips, hipSway, idleLift + walkLift + bodyDip, 0);
    this.applyRotation(this.bones.hips,
      0.07 * w * strideHeight,
      0.10 * ws * w * hipYaw,
      0.05 * ws * w * bodySway + 0.03 * this.presenceStrength * idleA
    );

    // spine / chest
    this.applyPositionOffset(this.bones.leftShoulder,  this.shoulderWidth, 0, 0);
    this.applyPositionOffset(this.bones.rightShoulder, -this.shoulderWidth, 0, 0);
    this.applyRotation(this.bones.spine,
      -0.03 * this.presenceStrength * idleA - 0.012 * w * strideHeight,
      -0.03 * ws * w * chestCounter,
      shoulderSway - 0.015 * idleB
    );
    this.applyRotation(this.bones.chest,
      -0.065 * w * strideHeight + 0.02 * this.idleStrength * idleB,
      -0.045 * ws * w * chestCounter,
      -0.03 * ws * w * bodySway + 0.02 * this.presenceStrength * idleA
    );
    this.applyRotation(this.bones.neck,
      0.016 * this.idleStrength * idleA + 0.008 * w * strideHeight,
      0.025 * this.presenceStrength * idleB,
      -0.008 * ws * w * bodySway
    );
    this.applyRotation(this.bones.head,
      -0.020 * this.idleStrength * idleB - 0.012 * w * strideHeight,
      -0.022 * this.presenceStrength * idleA,
      0.012 * idleA
    );

    // arms
    this.applyRotation(this.bones.leftShoulder,
      1.33 + 0.04 * this.idleStrength * idleA, -0.04 * ws * w * chestCounter,
       0.13 + 0.02 * idleB + shoulderSway);
    this.applyRotation(this.bones.rightShoulder,
      1.33 - 0.04 * this.idleStrength * idleA, -0.04 * ws * w * chestCounter,
      -0.13 - 0.02 * idleB + shoulderSway);
    this.applyRotation(this.bones.leftArm,
       0.03 * this.idleStrength * idleA + 0.05 * ws * w * leftLoad,
       0.012 * ws * w * chestCounter,
      -0.10 - 0.50 * ws * w * leftArmDrive - 0.02 * idleB);
    this.applyRotation(this.bones.rightArm,
      -0.03 * this.idleStrength * idleA + 0.05 * ws * w * rightLoad,
      -0.012 * ws * w * chestCounter,
       0.10 + 0.50 * ws * w * rightArmDrive + 0.02 * idleB);
    this.applyRotation(this.bones.leftForeArm,
      0.025 * ws * w * leftRecovery, 0,
      0.18 + 0.18 * ws * w * leftElbowBend);
    this.applyRotation(this.bones.rightForeArm,
      0.025 * ws * w * rightRecovery, 0,
      -0.18 - 0.18 * ws * w * rightElbowBend);
    this.applyRotation(this.bones.leftHand,
       0.01 * this.idleStrength * idleA - 0.022 * ws * w * leftArmDrive,   0.016 * idleB,
       0.018 + 0.022 * leftElbowBend);
    this.applyRotation(this.bones.rightHand,
      -0.01 * this.idleStrength * idleA - 0.022 * ws * w * rightArmDrive, -0.016 * idleB,
      -0.018 - 0.022 * rightElbowBend);

    // legs — sagittal (X) only; NO lateral Z to avoid leg abduction
    this.applyRotation(this.bones.leftUpLeg,
      (0.70 * leftStride - 0.10 * leftRecovery) * ws * w,
      0, 0);
    this.applyRotation(this.bones.rightUpLeg,
      (0.70 * rightStride - 0.10 * rightRecovery) * ws * w,
      0, 0);
    this.applyRotation(this.bones.leftLeg,
      leftKneeFlex * ws * w,
      0, 0);
    this.applyRotation(this.bones.rightLeg,
      rightKneeFlex * ws * w,
      0, 0);
    this.applyRotation(this.bones.leftFoot,
      (-0.22 * leftStride - 0.20 * leftToeLift) * ws * w,
      0, 0);
    this.applyRotation(this.bones.rightFoot,
      (-0.22 * rightStride - 0.20 * rightToeLift) * ws * w,
      0, 0);
  }
}
