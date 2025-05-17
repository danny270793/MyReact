export class Logger {
  private name: string
  constructor(name: string) {
    this.name = name
  }
  debug(text: string) {
    console.log(`DEBUG ${this.name} ${text}`)
  }
}
