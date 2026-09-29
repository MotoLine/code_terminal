const escape = "\x1b";
const csi = "\x9b";
const osc = "\x9d";
const stringTerminators = new Set(["\x90", "\x98", "\x9e", "\x9f"]);
const maxControlSequenceLength = 1024;

type ParserState = "ground" | "escape" | "csi" | "string" | "string-escape";

function normalizeCursorControl(sequence: string) {
  const decMode = sequence.match(/^(\x1b\[|\x9b)\?([0-9;]*)([hl])$/);
  if (decMode) {
    const [, prefix, rawModes, action] = decMode;
    const modes = rawModes.split(";");
    if (!modes.some((mode) => Number(mode || 0) === 12)) return sequence;

    const remainingModes = modes.filter((mode) => Number(mode || 0) !== 12);
    const hasRemainingMode = remainingModes.some((mode) => mode !== "");
    const preservedModes = hasRemainingMode
      ? `${prefix}?${remainingModes.join(";")}${action}`
      : "";
    return `${preservedModes}${prefix}?12l`;
  }

  const cursorStyle = sequence.match(/^(\x1b\[|\x9b)([0-9;]*)( )q$/);
  if (!cursorStyle) return sequence;

  const [, prefix, rawParams, intermediate] = cursorStyle;
  const params = rawParams.split(";");
  const style = Number(params[0] || 0);
  if (style !== 1 && style !== 3 && style !== 5) return sequence;

  params[0] = String(style + 1);
  return `${prefix}${params.join(";")}${intermediate}q`;
}

export class TerminalCursorOutputFilter {
  private state: ParserState = "ground";
  private controlSequence = "";
  private stringEndsWithBell = false;

  write(data: string) {
    let output = "";

    for (const character of data) {
      switch (this.state) {
        case "ground":
          if (character === escape) {
            this.controlSequence = character;
            this.state = "escape";
          } else if (character === csi) {
            this.controlSequence = character;
            this.state = "csi";
          } else if (character === osc) {
            output += character;
            this.state = "string";
            this.stringEndsWithBell = true;
          } else if (stringTerminators.has(character)) {
            output += character;
            this.state = "string";
            this.stringEndsWithBell = false;
          } else {
            output += character;
          }
          break;

        case "escape":
          this.controlSequence += character;
          if (character === "[") {
            this.state = "csi";
          } else if (character === "]") {
            output += this.controlSequence;
            this.controlSequence = "";
            this.state = "string";
            this.stringEndsWithBell = true;
          } else if (character === "P" || character === "X" || character === "^" || character === "_") {
            output += this.controlSequence;
            this.controlSequence = "";
            this.state = "string";
            this.stringEndsWithBell = false;
          } else if (character === escape) {
            output += escape;
            this.controlSequence = escape;
          } else {
            output += this.controlSequence;
            this.controlSequence = "";
            this.state = "ground";
          }
          break;

        case "csi":
          this.controlSequence += character;
          if (character === escape) {
            output += this.controlSequence.slice(0, -1);
            this.controlSequence = escape;
            this.state = "escape";
          } else if (character === "\x18" || character === "\x1a") {
            output += this.controlSequence;
            this.controlSequence = "";
            this.state = "ground";
          } else if (character.charCodeAt(0) >= 0x40 && character.charCodeAt(0) <= 0x7e) {
            output += normalizeCursorControl(this.controlSequence);
            this.controlSequence = "";
            this.state = "ground";
          } else if (this.controlSequence.length > maxControlSequenceLength) {
            output += this.controlSequence;
            this.controlSequence = "";
            this.state = "ground";
          }
          break;

        case "string":
          output += character;
          if (character === escape) {
            this.state = "string-escape";
          } else if (character === "\x9c" || (this.stringEndsWithBell && character === "\x07")) {
            this.state = "ground";
          }
          break;

        case "string-escape":
          output += character;
          if (character === "\\" || character === "\x9c") {
            this.state = "ground";
          } else if (character !== escape) {
            this.state = "string";
          }
          break;
      }
    }

    return output;
  }

  flush() {
    const pending = this.controlSequence;
    this.reset();
    return pending;
  }

  reset() {
    this.state = "ground";
    this.controlSequence = "";
    this.stringEndsWithBell = false;
  }
}
