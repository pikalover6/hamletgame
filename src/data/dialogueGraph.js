export const ENCOUNTER_DATA = {
  philosopherIntro: {
    startKey: "opening",
    nodes: {
      opening: {
        speaker: "The Philosopher",
        text: "You wait again. Thought keeps polishing the blade while the hour dulls.",
        choices: [
          {
            label: "Then let doubt die before the deed.",
            effects: { avengerScore: 1 },
            next: "sharpen",
          },
          {
            label: "Then let the deed wait until truth is plain.",
            effects: { philosopherScore: 1 },
            next: "temper",
          },
        ],
      },
      sharpen: {
        speaker: "The Philosopher",
        text: "You call urgency courage. Many men have used the same word to hide their fear of seeing clearly.",
        choices: [
          {
            label: "Fear is the name delay gives to resolve.",
            effects: { avengerScore: 1 },
            next: "threshold",
          },
          {
            label: "Resolve that will not endure a question is only appetite.",
            effects: { philosopherScore: 1 },
            next: "threshold",
          },
        ],
      },
      temper: {
        speaker: "The Philosopher",
        text: "You call caution wisdom. Many men have used the same word to perfume their surrender.",
        choices: [
          {
            label: "Then let me risk guilt rather than rot in delay.",
            effects: { avengerScore: 1 },
            next: "threshold",
          },
          {
            label: "Then let me remain answerable before I am active.",
            effects: { philosopherScore: 1 },
            next: "threshold",
          },
        ],
      },
      threshold: {
        speaker: "The Philosopher",
        text: "Go on. The next chamber gives argument a body and calls it necessity.",
        choices: [
          {
            label: "Enter the argument.",
            effects: {
              addFlags: ["encounter.philosopherIntro.complete"],
              completeEncounter: "philosopherIntro",
              objectiveKey: "start.exit",
            },
            next: "END",
          },
          {
            label: "Enter it anyway.",
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
            value: "You arrive almost persuaded. Say the word and hesitation will kneel before the hand.",
          },
          {
            when: { scoreAtLeast: { philosopherScore: 2 } },
            value: "You arrive trailing questions. I have no use for them, unless they finally sharpen into a strike.",
          },
          {
            value: "I am the thought that grows tired of being thought. Speak plainly. Will you act?",
          },
        ],
        choices: [
          {
            label: "Action is cleaner than another night of inward theatre.",
            effects: { avengerScore: 1 },
            next: "price",
          },
          {
            label: "A deed that cannot bear judgment is only another corruption.",
            effects: { philosopherScore: 1 },
            next: "price",
          },
        ],
      },
      price: {
        speaker: "The Avenger",
        text: "Every act chooses the man who acts. Will you pay with certainty, or with blood?",
        choices: [
          {
            label: "Certainty is a luxury. Blood answers faster.",
            effects: { avengerScore: 1 },
            next: "release",
          },
          {
            label: "Blood without certainty only multiplies the wound.",
            effects: { philosopherScore: 1, fatalistScore: 1 },
            next: "release",
          },
        ],
      },
      release: {
        speaker: "The Avenger",
        text: "Then carry that answer into the hall where delay rehearses itself forever.",
        choices: [
          {
            label: "Go on.",
            effects: {
              addFlags: ["encounter.avengerDebate.complete", "gate.delay.unlocked"],
              completeEncounter: "avengerDebate",
              objectiveKey: "debate.exit",
            },
            next: "END",
          },
          {
            label: "I will hear what delay has to say.",
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
            value: "You have already learned my lesson: every road keeps its dead in view.",
          },
          {
            value: "You have gathered the fragments, yet each one only reflects the cost of choosing. Do you see it now?",
          },
        ],
        choices: [
          {
            label: "I see that action and delay both leave bodies behind them.",
            effects: { fatalistScore: 1 },
            next: "measure",
          },
          {
            label: "I see that the body behind me is no excuse for stillness.",
            effects: { avengerScore: 1 },
            next: "measure",
          },
        ],
      },
      measure: {
        speaker: "The Witness",
        text: "Mortality is not counsel. It is a mirror. Some men use it to become grave. Some use it to become exact.",
        choices: [
          {
            label: "Then let death teach me measure.",
            effects: { philosopherScore: 1 },
            next: "passage",
          },
          {
            label: "Then let death strip my excuses bare.",
            effects: { fatalistScore: 1, avengerScore: 1 },
            next: "passage",
          },
        ],
      },
      passage: {
        speaker: "The Witness",
        text: "Go to the stage. There a face may lie so long it begins to feel like truth.",
        choices: [
          {
            label: "I will go.",
            effects: {
              addFlags: ["encounter.witnessDelay.complete", "gate.masks.unlocked"],
              completeEncounter: "witnessDelay",
              objectiveKey: "delay.exit",
            },
            next: "END",
          },
          {
            label: "Then let the theatre answer next.",
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
            value: "You arrive almost ready for me. A mask worn long enough begins to answer for the face.",
          },
          {
            value: "You call deception a costume, yet every virtue you wear before others is staged. Why deny the craft?",
          },
        ],
        choices: [
          {
            label: "Because craft without sincerity is another treason.",
            effects: { philosopherScore: 1 },
            next: "argument",
          },
          {
            label: "Because performance is power when truth cannot move the room.",
            effects: { actorScore: 1 },
            next: "argument",
          },
        ],
      },
      argument: {
        speaker: "The Actor",
        text: "Appearance moves men long before truth arrives. Will you refuse the instrument because it resembles a lie?",
        choices: [
          {
            label: "I will wield the appearance, but not mistake it for the self.",
            effects: { actorScore: 1, philosopherScore: 1 },
            next: "exit",
          },
          {
            label: "I will wear what wins, and let the face follow later.",
            effects: { actorScore: 2 },
            next: "exit",
          },
        ],
      },
      exit: {
        speaker: "The Actor",
        text: "Then go where masks fail. The last chamber remembers every choice whether or not you name it honestly.",
        choices: [
          {
            label: "Enter the reckoning.",
            effects: {
              addFlags: ["encounter.actorMasks.complete", "gate.consequence.unlocked"],
              completeEncounter: "actorMasks",
              objectiveKey: "masks.exit",
            },
            next: "END",
          },
          {
            label: "Let consequence judge the scene.",
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
            value: "The hand has learned impatience. One more answer and it will call itself destiny.",
          },
          {
            when: { dominantArchetype: "philosopher" },
            value: "Judgment has grown stately. One more answer and it will call itself virtue.",
          },
          {
            when: { dominantArchetype: "actor" },
            value: "Performance has grown persuasive. One more answer and it will call itself truth.",
          },
          {
            value: "No voice has mastered the chamber. One more answer may split it beyond repair.",
          },
        ],
        choices: [
          {
            label: "Let the strongest voice rule the hand.",
            effects: { addFlags: ["ending.embraceDominant"] },
            next: "seal",
          },
          {
            label: "Refuse a single master and keep the fracture open.",
            effects: { addFlags: ["ending.embraceFracture"], fatalistScore: 1 },
            next: "seal",
          },
        ],
      },
      seal: {
        speaker: "The Chorus",
        text: "So be it. What remains will not be argument but rule.",
        choices: [
          {
            label: "Endure the judgment.",
            effects: {
              addFlags: ["encounter.consequenceJudgment.complete"],
              completeEncounter: "consequenceJudgment",
              objectiveKey: "ending",
            },
            next: "END",
          },
          {
            label: "Let it begin.",
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