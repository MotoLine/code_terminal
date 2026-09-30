import assert from "node:assert/strict";
import test from "node:test";
import { TerminalImeAnchor } from "../.test-dist/terminalImeAnchor.js";

function host() {
  const properties = new Map();
  const classes = new Set();
  return {
    properties, classes,
    style: {
      setProperty: (key, value) => properties.set(key, value),
      removeProperty: (key) => properties.delete(key),
    },
    classList: { add: (key) => classes.add(key), remove: (key) => classes.delete(key) },
  };
}

test("composition anchor survives TUI cursor moves and duplicate starts", () => {
  const anchor = new TerminalImeAnchor();
  const element = host();
  const textarea = { style: { left: "128px", top: "240px" } };
  anchor.start(element, textarea);
  textarea.style.left = "0px";
  textarea.style.top = "0px";
  anchor.start(element, textarea);
  assert.equal(element.properties.get("--terminal-ime-left"), "128px");
  assert.equal(element.properties.get("--terminal-ime-top"), "240px");
  assert.ok(element.classes.has("terminal-ime-anchored"));
});

test("end/blur/cleanup releases coordinates; next composition captures its own origin", () => {
  const anchor = new TerminalImeAnchor();
  const first = host();
  anchor.start(first, { style: { left: "12px", top: "20px" } });
  anchor.release();
  anchor.release();
  assert.equal(first.properties.size, 0);
  assert.equal(first.classes.size, 0);
  const second = host();
  anchor.start(second, { style: { left: "60px", top: "80px" } });
  assert.equal(second.properties.get("--terminal-ime-left"), "60px");
  assert.equal(second.properties.get("--terminal-ime-top"), "80px");
  assert.equal(first.classes.size, 0);
});
