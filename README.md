# Inside Hamlet's Mind

A stylized 3D narrative game built with **Three.js** and **Vite**. You do not play Hamlet directly—you act as the guiding voice inside his mind during **Act IV** of *Hamlet*, shaping how he interprets guilt, revenge, fear, and survival.

## Project Overview

Inside Hamlet's Mind is a chamber-based psychological journey. The game combines:

- third-person movement in surreal environments,
- branching dialogue encounters,
- score-driven identity tracking,
- and ending resolution based on the dominant inner voice.

The entire experience is set after Polonius is killed. Claudius sends Hamlet to England, Ophelia fractures, Laertes returns enraged, and the player decides which internal philosophy will rule Hamlet's next actions.

## Technical Stack

- **Runtime**: JavaScript (ES Modules)
- **Renderer / Engine layer**: Three.js
- **Build tool**: Vite
- **Audio**: Web Audio API (procedural ambient + interaction cues)
- **State persistence**: `window.localStorage`
- **Assets**:
  - `a_man_in_suit.glb` (base character rig)
  - `walk.fbx` (optional walk animation clip)

## Repository Structure

```text
/home/runner/work/hamletgame/hamletgame
├── index.html                  # HUD layout, title/pause/ending UI shell
├── src
│   ├── main.js                 # bootstrap
│   ├── game
│   │   ├── GameDirector.js     # orchestration loop, modes, interactions, flow
│   │   ├── GameStateManager.js # save/load, scoring, flags, ending resolution
│   │   └── conditions.js       # conditional dialogue/logic evaluation helpers
│   ├── data
│   │   ├── chambers.js         # chamber definitions, moods, bounds, anchors
│   │   ├── dialogueGraph.js    # encounter node graphs and branching choices
│   │   ├── objectives.js       # objective text by progression key
│   │   └── endings.js          # ending copy + ending visual mood data
│   ├── Environment.js          # procedural chamber geometry and interactive props
│   ├── PlayerController.js     # movement, camera follow, pointer lock
│   ├── InteractionSystem.js    # nearest interactable detection and prompts
│   ├── DialogueSystem.js       # dialogue rendering + choice application
│   ├── PostProcessing.js       # custom shader pass (grain, aberration, tint)
│   ├── CharacterAnimator.js    # clip remapping + procedural animation fallback
│   ├── characters/CharacterFactory.js
│   ├── audio/AudioManager.js   # ambient tone, footsteps, interaction stingers
│   ├── ui/uiElements.js
│   └── style.css
└── package.json
```

## Core Runtime Flow

1. `src/main.js` calls `startGame()` from `GameDirector`.
2. `GameDirector` initializes renderer, scene, camera, lights, post-processing, environment, state, audio, and characters.
3. Input and UI events transition between modes:
   - `title`
   - `explore`
   - `dialogue`
   - `transition`
   - `pause`
   - `ending`
4. `InteractionSystem` exposes context-sensitive prompts (`Press E`) for NPCs, collectibles, gateways, and the final dais.
5. `DialogueSystem` evaluates encounter nodes, applies choice effects, and updates scores/flags/objectives.
6. `GameStateManager` persists progress and computes the dominant archetype for ending selection.

## Controls

- **W / A / S / D**: Move
- **Mouse**: Look (after click/pointer lock)
- **E**: Interact / advance encounter choices
- **Esc**: Pause / resume

## Progression and Systems

### Chambers and Progression Gates

The game advances through five major chambers (`CHAMBER_SEQUENCE`):

1. **Start Chamber**
2. **Debate Chamber**
3. **Hall of Delay**
4. **Stage of Masks**
5. **Chamber of Consequence**

Each chamber has:

- its own world-space origin and spawn point,
- movement bounds,
- visual/post-processing mood profile,
- NPC anchors and interaction anchors,
- and progression gates unlocked by completed encounters or collected tokens.

### Archetype Scores

Player choices modify four internal score channels:

- `avengerScore`
- `philosopherScore`
- `actorScore`
- `fatalistScore`

These scores influence conditional dialogue lines, chamber tinting, and ending determination.

### Flags and Collections

State includes flags and collection tokens for progression logic:

- `resolvedFlags`
- `completedEncounters`
- `collectedFragments` (Hall of Delay)
- `activatedStageMarks` (Stage of Masks)
- `activatedJudgmentPlates` (Consequence)

### Ending Resolution

At final judgment, the game resolves a dominant archetype. It can produce:

- **avenger**
- **philosopher**
- **actor**
- **fractured** (tie/conflicted path, or explicit fracture choice)

Unlocked endings are tracked in save data.

## Detailed Storyline

### Narrative Frame

The story begins immediately after Hamlet kills Polonius behind the arras. This act is treated as the psychological break point: every chamber asks whether that killing was justice, panic, strategy, or the beginning of collapse.

You are not a passive observer. You are the deciding pressure inside Hamlet's conscience, and your answers shape what kind of self emerges before the voyage to England and the conflict with Laertes.

### Chamber 1: Start Chamber — The First Reckoning

- **Context**: Gertrude has witnessed violence. Claudius is already recalculating.
- **Voice encountered**: **The Philosopher**.
- **Core question**: Was Polonius's death necessary action or moral failure?
- **Outcome**: Your early answers establish whether Hamlet moves forward with sharpened revenge or with caution and accountability.

This chamber introduces the central mechanic: every answer adds weight to an inner doctrine.

### Chamber 2: Debate Chamber — The Avenger's Demand

- **Context**: Claudius sends Hamlet to England under guard.
- **Voice encountered**: **The Avenger**.
- **Core question**: Should Hamlet preempt his enemies with force, or refuse to let rage script every move?
- **Narrative pressure**: Laertes is expected to return in fury once he learns of Polonius.

The chamber reframes Act IV politics as urgency. Hamlet is being moved like a piece on Claudius's board, and the avenging impulse argues that hesitation now equals surrender.

### Chamber 3: Hall of Delay — Witnessing the Damage

- **Context**: Ophelia breaks into disjointed song; grief spreads through the court.
- **Voice encountered**: **The Witness** (after collecting three narrative fragments).
- **Core question**: Can Hamlet still claim control, or has performance and madness already consumed him?

This chamber is about consequence accumulation. The game forces the player to gather symbolic fragments before speaking to the Witness, emphasizing that moral conclusions require confronting evidence, not only emotion.

### Chamber 4: Stage of Masks — Strategy vs Self-Erasure

- **Context**: Survival depends on role-play, deception, and controlled appearances.
- **Voice encountered**: **The Actor** (after activating three stage marks).
- **Core question**: Is feigned madness a tactical tool, or a permanent surrender of identity?

Here the game treats performance as both weapon and danger. You can use the mask to survive Claudius, but repeated strategic concealment risks hollowing out Hamlet's sincerity.

### Chamber 5: Chamber of Consequence — Judgment of the Inner Court

- **Context**: All voices converge as Act IV closes.
- **Requirements**: Activate three judgment plates, then step onto the final dais.
- **Encounter**: **The Chorus** summarizes your dominant trajectory.
- **Final decision**:
  - embrace a ruling voice,
  - or explicitly keep Hamlet divided.

This is the culmination of all prior weighting. Earlier scores, flags, and your final stance decide the ending text and mood.

### Endings Explained

#### The Avenger Speaks
Hamlet treats Polonius's death as precedent and commits to retaliatory force. Act IV closes with blood-logic ascendant.

#### The Philosopher Remains
Hamlet privileges judgment and moral scrutiny, resisting impulsive violence even while seeing danger clearly.

#### The Actor Ascends
Hamlet survives through strategic performance, using masks and courtly theater to stay alive—at the cost of authenticity.

#### The Mind Divides
No single doctrine can govern the damage. Hamlet exits Act IV split between revenge, conscience, and disguise.

## Save Behavior

- Save key: `inside-hamlets-mind-save-v2`
- Save includes chamber progression, objectives, scores, flags, encounters, collection progress, and unlocked endings.
- `Continue` is shown only when save data exists.
- Starting a new run resets progression state.

## Setup and Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Notes

- The project expects `a_man_in_suit.glb` at repository root.
- `walk.fbx` is optional; if missing, animation falls back to procedural locomotion.
- Dist and dependency folders may exist in this repository clone, but source-of-truth logic is under `/src`.
