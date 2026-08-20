/**
 * Sends in flight at once.
 *
 * Telegram's bulk guidance is about 30 messages a second, and a few hundred
 * simultaneous requests earn 429s instead of delivery. Sixteen lanes is the
 * compromise the send budget is sized around — at ~200ms per Telegram call
 * that's roughly 80/s; lower this if 429s show up in the per-user logs.
 */
export const SEND_CONCURRENCY = 16;

/**
 * Stop dispatching this far into the run.
 *
 * vercel.json allows 30s per function. Being killed at the limit is exactly
 * the failure being avoided — no response, no record of where it stopped.
 * Stopping at 24s leaves room for in-flight sends to land and for the
 * handler to return a count that admits it did not finish.
 */
export const SEND_DEADLINE_MS = 24_000;

/**
 * Runs `worker` over `items` with at most `concurrency` in flight,
 * abandoning the rest when `shouldStop()` turns true.
 *
 * Lanes pull from a shared cursor instead of being handed a fixed slice, so
 * one slow send does not leave the other lanes idle waiting for it at the
 * end of a run. Nothing here knows about reminders, challenges or Telegram —
 * it is exported so the pacing can be tested against a fake task, with no
 * token and no network. Originally lived in routes/cron.js; moved here once
 * a second caller (the admin challenge broadcast) needed the same pacing.
 *
 * `worker` is expected to handle its own failures: a throw propagates and
 * takes the pool down with it — every caller wraps its own worker body.
 *
 * @returns {Promise<{started: number, stopped: boolean}>} how many items
 *   were handed to a worker, and whether the deadline cut the run short.
 */
export async function runPool(items, worker, { concurrency = SEND_CONCURRENCY, shouldStop = () => false } = {}) {
  const lanes = Math.max(1, Math.min(concurrency, items.length));
  let cursor = 0;
  let started = 0;
  let stopped = false;

  async function lane() {
    for (;;) {
      if (shouldStop()) {
        stopped = true;
        return;
      }
      const index = cursor++;
      if (index >= items.length) return;
      started += 1;
      await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: lanes }, lane));
  return { started, stopped };
}
