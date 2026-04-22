export class DialogueSystem {
  constructor() {
    this.active = false
    this.dialogueBox = document.querySelector('#dialogue')
    this.speakerEl = document.querySelector('#dialogue-speaker')
    this.lineEl = document.querySelector('#dialogue-line')
    this.choicesEl = document.querySelector('#choices')
  }

  start({ speaker, nodes, onChoice, onComplete }) {
    this.active = true
    this.dialogueBox.classList.remove('hidden')

    let index = 0
    const state = { avenger: 0, philosopher: 0 }

    const renderNode = () => {
      const node = nodes[index]
      this.speakerEl.textContent = speaker
      this.lineEl.textContent = node.line
      this.choicesEl.innerHTML = ''

      node.choices.forEach((choice) => {
        const button = document.createElement('button')
        button.className = 'choice'
        button.textContent = choice.text
        button.addEventListener('click', () => {
          state[choice.alignment] += 1
          onChoice(choice, state)
          index += 1

          if (index >= nodes.length) {
            this.finish()
            onComplete(state.avenger > state.philosopher ? 'avenger' : 'philosopher')
            return
          }

          renderNode()
        })
        this.choicesEl.appendChild(button)
      })
    }

    renderNode()
  }

  showFinalLine(speaker, line, onContinue) {
    this.active = true
    this.dialogueBox.classList.remove('hidden')
    this.speakerEl.textContent = speaker
    this.lineEl.textContent = line
    this.choicesEl.innerHTML = ''

    const button = document.createElement('button')
    button.className = 'choice'
    button.textContent = 'Continue'
    button.addEventListener('click', () => {
      this.finish()
      onContinue()
    })

    this.choicesEl.appendChild(button)
  }

  finish() {
    this.active = false
    this.dialogueBox.classList.add('hidden')
  }
}
