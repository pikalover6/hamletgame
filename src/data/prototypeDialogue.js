export const prototypeDialogue = {
  start: {
    speaker: "The Philosopher",
    text: "Polonius is dead behind the curtain. Name it: justice, mistake, or both.",
    choices: [
      {
        label: "Act now. Claudius will not wait for my conscience.",
        alignment: "avenger",
        next: "urgentReply",
      },
      {
        label: "Wait. One wrong strike has already been made.",
        alignment: "philosopher",
        next: "measuredReply",
      },
    ],
  },
  urgentReply: {
    speaker: "The Philosopher",
    text: "Gertrude saw the body. Claudius sends you to England. Will you answer him with force?",
    choices: [
      {
        label: "Yes. Better danger than obedience.",
        alignment: "avenger",
        next: "threshold",
      },
      {
        label: "No. Another blind stroke serves Claudius.",
        alignment: "philosopher",
        next: "threshold",
      },
    ],
  },
  measuredReply: {
    speaker: "The Philosopher",
    text: "Delay has a cost as well. Ophelia is unraveling and Laertes is returning armed.",
    choices: [
      {
        label: "Then no more delay. Grief will turn into steel.",
        alignment: "avenger",
        next: "threshold",
      },
      {
        label: "Then keep doubt. Better that than blind revenge.",
        alignment: "philosopher",
        next: "threshold",
      },
    ],
  },
  threshold: {
    speaker: "The Philosopher",
    text: "Step forward. Act IV tightens around Hamlet now.",
    choices: [
      {
        label: "Step toward revenge.",
        alignment: "avenger",
        next: "END",
      },
      {
        label: "Step toward judgment.",
        alignment: "philosopher",
        next: "END",
      },
    ],
  },
};
