/** Pin both xterm's pre-edit text and the native IME textarea to one input origin.
 * xterm updates their inline coordinates on every render, including TUI cursor moves.
 * Scoped CSS variables override only coordinates, leaving text/commit handling to xterm.
 */
export class TerminalImeAnchor {
  private host: HTMLElement | null = null;

  start(host: HTMLElement, textarea: HTMLTextAreaElement) {
    if (this.host) return;
    this.host = host;
    host.style.setProperty("--terminal-ime-left", textarea.style.left || "0px");
    host.style.setProperty("--terminal-ime-top", textarea.style.top || "0px");
    host.classList.add("terminal-ime-anchored");
  }

  release() {
    if (!this.host) return;
    this.host.classList.remove("terminal-ime-anchored");
    this.host.style.removeProperty("--terminal-ime-left");
    this.host.style.removeProperty("--terminal-ime-top");
    this.host = null;
  }
}
