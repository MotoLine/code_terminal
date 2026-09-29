import assert from "node:assert/strict";
import test from "node:test";
import { TerminalCursorOutputFilter } from "../.test-dist/terminalCursorOutputFilter.js";

test("DECSET cursor blink is forced off while other private modes are preserved", () => {
  const filter = new TerminalCursorOutputFilter();

  assert.equal(filter.write("\x1b[?12h"), "\x1b[?12l");
  assert.equal(filter.write("\x1b[?25;12h"), "\x1b[?25h\x1b[?12l");
  assert.equal(filter.write("\x1b[?12;25l"), "\x1b[?25l\x1b[?12l");
});

test("blinking DECSCUSR styles become steady versions of the same shape", () => {
  const filter = new TerminalCursorOutputFilter();

  assert.equal(filter.write("\x1b[1 q\x1b[3 q\x1b[5 q"), "\x1b[2 q\x1b[4 q\x1b[6 q");
  assert.equal(filter.write("\x1b[2 q\x1b[4 q\x1b[6 q\x1b[0 q"), "\x1b[2 q\x1b[4 q\x1b[6 q\x1b[0 q");
});

test("unrelated CSI sequences and OSC strings pass through unchanged", () => {
  const filter = new TerminalCursorOutputFilter();
  const data = "\x1b[31mred\x1b[2;4H\x1b]0;title \x1b[?12h\x07";

  assert.equal(filter.write(data), data);
  assert.equal(filter.write("\x1b[?12h"), "\x1b[?12l");
});

test("cursor control sequences split across PTY chunks are normalized", () => {
  const filter = new TerminalCursorOutputFilter();

  assert.equal(filter.write("text\x1b[?1"), "text");
  assert.equal(filter.write("2h\x1b[5 "), "\x1b[?12l");
  assert.equal(filter.write("qdone"), "\x1b[6 qdone");
});

test("flush returns an incomplete CSI unchanged and reset isolates the next session", () => {
  const filter = new TerminalCursorOutputFilter();

  assert.equal(filter.write("\x1b[?12"), "");
  assert.equal(filter.flush(), "\x1b[?12");
  assert.equal(filter.write("\x1b[?12h"), "\x1b[?12l");
});
