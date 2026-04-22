export const ENCOUNTER_DATA = {
  philosopherIntro: {
    startKey: "opening",
    nodes: {
      opening: {
        speaker: "The Philosopher",
        text: "Polonius lies behind the arras. You, guiding voice, must answer first: was that justice or panic?",
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
        text: "Gertrude saw blood and heard your prince call it providence. Can you keep calling this necessity?",
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
        text: "Good. Keep the question sharp: one corpse has already made every witness dangerous.",
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
        text: "Then walk on. Claudius has already turned this killing into a reason to ship Hamlet to England.",
        choices: [
          {
            label: "Follow the king's order and read the trap.",
            effects: {
              addFlags: ["encounter.philosopherIntro.complete"],
              completeEncounter: "philosopherIntro",
              objectiveKey: "start.exit",
            },
            next: "END",
          },
          {
            label: "Go anyway, but keep one hand on the hidden knife.",
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
            value: "Still counting costs? Claudius writes for England while you polish conscience.",
          },
          {
            value: "I am the will that refuses another delay. Speak plain: do we move on Claudius or let him script us?",
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
        text: "Laertes will hear of his father and come home furious. Will you meet that storm with steel or apology?",
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
        text: "Carry it forward. In the next hall, even Ophelia's songs begin to sound like evidence against us.",
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
            value: "You already hear the river in every corridor. Ophelia sings to no one and flowers to the air.",
          },
          {
            value: "Look well: Polonius buried, Ophelia undone, Gertrude terrified, Laertes returning. Do you see the chain?",
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
        text: "Death gives no counsel. It only strips your language bare. Was madness ever a tactic, or has it become the man?",
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
        text: "Then go to the stage. Rosencrantz and Guildenstern walk beside him as friends and carry him like cargo.",
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
            value: "You call this falsehood. I call it staying alive while Claudius writes your ending in another country.",
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
        text: "Feign madness to Gertrude, courtesy to spies, obedience to the voyage. Strategy or surrender?",
        choices: [
          {
            label: "Strategy. We perform only until Claudius is exposed.",
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
        text: "Then enter the last chamber. Laertes is nearly at the gate, and Claudius is ready to aim that fury at Hamlet.",
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
            value: "Judgment leads. Every step asks whether revenge can still claim the name of justice.",
          },
          {
            when: { dominantArchetype: "actor" },
            value: "Performance leads. Every smile hides a counter-move, and sincerity is now a risk.",
          },
          {
            value: "No voice rules. Act IV closes with pressure from every side and no clean hand left.",
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
        text: "So be it. The voyage, the court, Ophelia's songs, and Laertes's rage will answer this choice soon enough.",
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
