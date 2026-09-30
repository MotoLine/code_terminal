import assert from "node:assert/strict";
import test from "node:test";
import { takeTerminalOutputBatch } from "../.test-dist/terminalOutputBatch.js";

test("short output stays in one write batch", () => {
  const queue = ["short output"];
  assert.equal(takeTerminalOutputBatch(queue), "short output");
  assert.deepEqual(queue, []);
});

test("long output combines four 4096-byte chunks per xterm write", () => {
  const queue = ["a".repeat(4096), "b".repeat(4096), "c".repeat(4096), "d".repeat(4096), "e"];
  assert.equal(takeTerminalOutputBatch(queue).length, 16384);
  assert.equal(queue.length, 1);
  assert.equal(takeTerminalOutputBatch(queue), "e");
  assert.deepEqual(queue, []);
});

test("an oversized queue item still makes progress", () => {
  const queue = ["x".repeat(20000), "tail"];
  assert.equal(takeTerminalOutputBatch(queue).length, 20000);
  assert.deepEqual(queue, ["tail"]);
});
