export const prototypeDialogue = {
  start: {
    speaker: "The Philosopher",
    text: "You wait again. Thought keeps polishing the blade while the hour dulls.",
    choices: [
      {
        label: "Then I should act before doubt seals my hand.",
        alignment: "avenger",
        next: "urgentReply",
      },
      {
        label: "Then I should wait until the wound tells the truth.",
        alignment: "philosopher",
        next: "measuredReply",
      },
    ],
  },
  urgentReply: {
    speaker: "The Philosopher",
    text: "Action has a cost. Will you pay in blood to escape your own delay?",
    choices: [
      {
        label: "Yes. Better a scar than another speech.",
        alignment: "avenger",
        next: "threshold",
      },
      {
        label: "No. A wrong stroke only crowns the lie.",
        alignment: "philosopher",
        next: "threshold",
      },
    ],
  },
  measuredReply: {
    speaker: "The Philosopher",
    text: "Thinking has a cost as well. Will you let another night make cowardice look wise?",
    choices: [
      {
        label: "No. Delay has fed the rot long enough.",
        alignment: "avenger",
        next: "threshold",
      },
      {
        label: "Yes. Better doubt than a blind revenge.",
        alignment: "philosopher",
        next: "threshold",
      },
    ],
  },
  threshold: {
    speaker: "The Philosopher",
    text: "Then step forward. The next chamber strips appearance from desire.",
    choices: [
      {
        label: "Step into force.",
        alignment: "avenger",
        next: "END",
      },
      {
        label: "Step into judgment.",
        alignment: "philosopher",
        next: "END",
      },
    ],
  },
};