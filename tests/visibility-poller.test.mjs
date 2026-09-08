import assert from "node:assert/strict";
import test from "node:test";

import { createVisibilityPoller } from "../app/lib/visibility-poller.ts";

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function harness(load) {
  let now = 0;
  let visible = true;
  let intervalCallback;
  let visibilityCallback;
  let timerCleared = false;
  let listenerRemoved = false;
  const poller = createVisibilityPoller({
    load,
    intervalMs: 60_000,
    now: () => now,
    isVisible: () => visible,
    schedule: (callback) => {
      intervalCallback = callback;
      return 77;
    },
    clearSchedule: (timer) => {
      assert.equal(timer, 77);
      timerCleared = true;
    },
    subscribeVisibility: (callback) => {
      visibilityCallback = callback;
      return () => {
        listenerRemoved = true;
      };
    },
  });
  return {
    poller,
    advance: (milliseconds) => { now += milliseconds; },
    setVisible: (next) => { visible = next; },
    tick: () => intervalCallback(),
    visibilityChange: () => visibilityCallback(),
    cleanupState: () => ({ timerCleared, listenerRemoved }),
  };
}

test("poller loads immediately and does not overlap a slow request", async () => {
  const pending = deferred();
  let calls = 0;
  const env = harness(() => {
    calls += 1;
    return pending.promise;
  });

  const initial = env.poller.start();
  env.advance(60_000);
  await env.tick();

  assert.equal(calls, 1);
  pending.resolve();
  assert.equal(await initial, true);
});

test("poller pauses while hidden and refreshes stale data when visible", async () => {
  let calls = 0;
  const env = harness(async () => { calls += 1; });
  await env.poller.start();
  env.setVisible(false);
  env.advance(60_000);
  await env.tick();
  assert.equal(calls, 1);

  env.advance(60_000);
  env.setVisible(true);
  await env.visibilityChange();
  await Promise.resolve();
  assert.equal(calls, 2);
});

test("poller preserves the visible interval cadence", async () => {
  let calls = 0;
  const env = harness(async () => { calls += 1; });
  await env.poller.start();
  env.advance(59_999);
  await env.tick();
  assert.equal(calls, 1);
  env.advance(1);
  await env.tick();
  assert.equal(calls, 2);
});

test("stopping removes timers and listeners and prevents future loads", async () => {
  let calls = 0;
  const env = harness(async () => { calls += 1; });
  await env.poller.start();

  env.poller.stop();
  env.advance(60_000);
  await env.tick();
  await env.visibilityChange();

  assert.equal(calls, 1);
  assert.deepEqual(env.cleanupState(), { timerCleared: true, listenerRemoved: true });
});
