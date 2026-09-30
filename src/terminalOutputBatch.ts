export const terminalOutputChunkSize = 4096;
export const terminalOutputBatchSize = 16384;

/** Take a bounded batch from the output queue so long streams cross fewer xterm write boundaries. */
export function takeTerminalOutputBatch(queue: string[], maxChars = terminalOutputBatchSize) {
  if (queue.length === 0 || maxChars <= 0) return "";

  let length = 0;
  let count = 0;
  while (count < queue.length && length + queue[count].length <= maxChars) {
    length += queue[count].length;
    count += 1;
  }

  // A single oversized item must still make progress.
  if (count === 0) count = 1;
  return queue.splice(0, count).join("");
}
