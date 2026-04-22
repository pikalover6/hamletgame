export const ENCOUNTER_DATA = {
  philosopherIntro: {
    startKey: "opening",
    nodes: {
      opening: {
        speaker: "The Philosopher",
        text: "Polonius is dead behind Gertrude's arras. Hamlet aimed for Claudius and killed the wrong man. Name it: justice, mistake, or panic?",
        choices: [
          {
            label: "A mistaken blow still clears the path to Claudius.",
            effects: { avengerScore: 1 },
            next: "sharpen",
          },
          {
            label: "A king was spared, and an old man died for it.",
            effects: { philosopherScore: 1 },
            next: "temper",
          },
        ],
      },
      sharpen: {
        speaker: "The Philosopher",
        text: "Gertrude watched the body fall and heard Hamlet call it heaven's judgment. Do we keep that claim now that the corpse is Polonius?",
        choices: [
          {
            label: "Fear is for courtiers. We strike again before Claudius settles.",
            effects: { avengerScore: 1 },
            next: "threshold",
          },
          {
            label: "If we cannot name the right target, we are already lost.",
            effects: { philosopherScore: 1 },
            next: "threshold",
          },
        ],
      },
      temper: {
        speaker: "The Philosopher",
        text: "Then stay exact: one wrong death has already armed Claudius with a public case against Hamlet.",
        choices: [
          {
            label: "Questions do not stop Claudius from moving first.",
            effects: { avengerScore: 1 },
            next: "threshold",
          },
          {
            label: "Then we answer for Polonius before we add another name.",
            effects: { philosopherScore: 1 },
            next: "threshold",
          },
        ],
      },
      threshold: {
        speaker: "The Philosopher",
        text: "Move. Claudius has turned Polonius's death into a warrant to send Hamlet to England under guard.",
        choices: [
          {
            label: "Go to England and assume the letters are meant to kill Hamlet.",
            effects: {
              addFlags: ["encounter.philosopherIntro.complete"],
              completeEncounter: "philosopherIntro",
              objectiveKey: "start.exit",
            },
            next: "END",
          },
          {
            label: "Go under escort, but prepare to break Claudius's plan at sea.",
            effects: {
              addFlags: ["encounter.philosopherIntro.complete"],
              completeEncounter: "philosopherIntro",
              objectiveKey: "start.exit",
            },
            next: "END",
          },
        ],
      },
    },
  },
  avengerDebate: {
    startKey: "summons",
    nodes: {
      summons: {
        speaker: "The Avenger",
        text: [
          {
            when: { scoreAtLeast: { avengerScore: 2 } },
            value: "At last. Polonius is done, and Claudius finally shows his fear by sending Hamlet away under guard.",
          },
          {
            when: { scoreAtLeast: { philosopherScore: 2 } },
            value: "Still counting costs? Claudius has already written to England while you weigh guilt.",
          },
          {
            value: "Enough delay. Claudius controls the guard, the route, and the letters. Do we seize initiative now or stay in his script?",
          },
        ],
        choices: [
          {
            label: "He sends us to England to finish what poison began. Act first.",
            effects: { avengerScore: 1 },
            next: "price",
          },
          {
            label: "If every move is rage, Claudius needs no better proof against us.",
            effects: { philosopherScore: 1 },
            next: "price",
          },
        ],
      },
      price: {
        speaker: "The Avenger",
        text: "Laertes is coming home to bury his father. He will blame Hamlet before he hears a full word. Do we meet him with force or remorse?",
        choices: [
          {
            label: "Steel. Let grief come armed; we answer armed.",
            effects: { avengerScore: 1 },
            next: "release",
          },
          {
            label: "Apology first. Blood on blood only serves Claudius.",
            effects: { philosopherScore: 1, fatalistScore: 1 },
            next: "release",
          },
        ],
      },
      release: {
        speaker: "The Avenger",
        text: "Carry it forward. In the next hall you will hear Ophelia's fractured songs and see what this death has done to the court.",
        choices: [
          {
            label: "Go. We face what the court has become.",
            effects: {
              addFlags: ["encounter.avengerDebate.complete", "gate.delay.unlocked"],
              completeEncounter: "avengerDebate",
              objectiveKey: "debate.exit",
            },
            next: "END",
          },
          {
            label: "Go. Let the dead speak before we choose again.",
            effects: {
              addFlags: ["encounter.avengerDebate.complete", "gate.delay.unlocked"],
              completeEncounter: "avengerDebate",
              objectiveKey: "debate.exit",
            },
            next: "END",
          },
        ],
      },
    },
  },
  witnessDelay: {
    startKey: "reckoning",
    nodes: {
      reckoning: {
        speaker: "The Witness",
        text: [
          {
            when: { scoreAtLeast: { fatalistScore: 2 } },
            value: "You already hear the river in every corridor. Ophelia wanders singing to no one, handing flowers to air and memory.",
          },
          {
            value: "Look plainly: Polonius buried in haste, Ophelia unraveling, Gertrude afraid, Laertes returning armed. Do you see the chain?",
          },
        ],
        choices: [
          {
            label: "Yes. Every choice now costs someone we once named innocent.",
            effects: { fatalistScore: 1 },
            next: "measure",
          },
          {
            label: "I see it, but grief cannot be our king.",
            effects: { avengerScore: 1 },
            next: "measure",
          },
        ],
      },
      measure: {
        speaker: "The Witness",
        text: "The deaths do not argue back. They only expose what we did. Is Hamlet still using madness as cover, or has the role consumed him?",
        choices: [
          {
            label: "Keep the mask deliberate; do not let it swallow Hamlet whole.",
            effects: { philosopherScore: 1 },
            next: "passage",
          },
          {
            label: "Let it swallow him if it keeps him alive past England.",
            effects: { fatalistScore: 1, avengerScore: 1 },
            next: "passage",
          },
        ],
      },
      passage: {
        speaker: "The Witness",
        text: "Go to the stage. Rosencrantz and Guildenstern speak like friends while escorting Hamlet to England like cargo.",
        choices: [
          {
            label: "Go. We play along and watch every hand.",
            effects: {
              addFlags: ["encounter.witnessDelay.complete", "gate.masks.unlocked"],
              completeEncounter: "witnessDelay",
              objectiveKey: "delay.exit",
            },
            next: "END",
          },
          {
            label: "Go. Let performance buy us one more breath.",
            effects: {
              addFlags: ["encounter.witnessDelay.complete", "gate.masks.unlocked"],
              completeEncounter: "witnessDelay",
              objectiveKey: "delay.exit",
            },
            next: "END",
          },
        ],
      },
    },
  },
  actorMasks: {
    startKey: "curtain",
    nodes: {
      curtain: {
        speaker: "The Actor",
        text: [
          {
            when: { scoreAtLeast: { actorScore: 2 } },
            value: "Good. In Act IV, survival belongs to the best performer. Smile for the king and read the sealed letters later.",
          },
          {
            value: "Call it falsehood if you want. It keeps Hamlet breathing while Claudius signs his death in a foreign court.",
          },
        ],
        choices: [
          {
            label: "If the mask becomes truth, we lose the man we mean to save.",
            effects: { philosopherScore: 1 },
            next: "argument",
          },
          {
            label: "A living mask can still avenge; a sincere corpse cannot.",
            effects: { actorScore: 1 },
            next: "argument",
          },
        ],
      },
      argument: {
        speaker: "The Actor",
        text: "Madness before Gertrude, courtesy before spies, obedience before guards. Is this controlled strategy or total surrender?",
        choices: [
          {
            label: "Strategy. Perform only until Claudius can be answered in public.",
            effects: { actorScore: 1, philosopherScore: 1 },
            next: "exit",
          },
          {
            label: "Surrender. Keep performing; let the role decide for us.",
            effects: { actorScore: 2 },
            next: "exit",
          },
        ],
      },
      exit: {
        speaker: "The Actor",
        text: "Enter the last chamber. Laertes is nearly at Elsinore's gate, and Claudius is ready to point that fury at Hamlet.",
        choices: [
          {
            label: "Enter and claim the next move before they do.",
            effects: {
              addFlags: ["encounter.actorMasks.complete", "gate.consequence.unlocked"],
              completeEncounter: "actorMasks",
              objectiveKey: "masks.exit",
            },
            next: "END",
          },
          {
            label: "Enter and let consequence name us.",
            effects: {
              addFlags: ["encounter.actorMasks.complete", "gate.consequence.unlocked"],
              completeEncounter: "actorMasks",
              objectiveKey: "masks.exit",
            },
            next: "END",
          },
        ],
      },
    },
  },
  consequenceJudgment: {
    startKey: "chorus",
    nodes: {
      chorus: {
        speaker: "The Chorus",
        text: [
          {
            when: { dominantArchetype: "avenger" },
            value: "The blade leads. Polonius is precedent, Laertes is coming, and Claudius still breathes.",
          },
          {
            when: { dominantArchetype: "philosopher" },
            value: "Judgment leads. Hamlet still asks whether killing Claudius can remain justice after killing Polonius.",
          },
          {
            when: { dominantArchetype: "actor" },
            value: "Performance leads. Hamlet survives by mask, courtesy, and misdirection while Claudius hunts him through policy.",
          },
          {
            value: "No voice rules. Act IV closes with Polonius dead, Ophelia broken, Laertes enraged, and Claudius still in power.",
          },
        ],
        choices: [
          {
            label: "Choose one ruling voice and drive Hamlet toward it.",
            effects: { addFlags: ["ending.embraceDominant"] },
            next: "seal",
          },
          {
            label: "Refuse one master and leave him divided.",
            effects: { addFlags: ["ending.embraceFracture"], fatalistScore: 1 },
            next: "seal",
          },
        ],
      },
      seal: {
        speaker: "The Chorus",
        text: "So be it. The voyage, Claudius's letters, Ophelia's collapse, and Laertes's return will test this choice immediately.",
        choices: [
          {
            label: "Hold to the choice.",
            effects: {
              addFlags: ["encounter.consequenceJudgment.complete"],
              completeEncounter: "consequenceJudgment",
              objectiveKey: "ending",
            },
            next: "END",
          },
          {
            label: "Let Act IV close.",
            effects: {
              addFlags: ["encounter.consequenceJudgment.complete"],
              completeEncounter: "consequenceJudgment",
              objectiveKey: "ending",
            },
            next: "END",
          },
        ],
      },
    },
  },
};
