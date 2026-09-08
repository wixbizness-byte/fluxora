import assert from "node:assert/strict";
import test from "node:test";

import { createRequestCoordinator } from "../app/member/request-coordinator.ts";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("request coordinator shares one in-flight request across overlapping refresh triggers", async () => {
  const pending = deferred();
  let calls = 0;
  const coordinator = createRequestCoordinator(() => {
    calls += 1;
    return pending.promise;
  });

  const focusRequest = coordinator.run();
  const visibilityRequest = coordinator.run();

  assert.strictEqual(visibilityRequest, focusRequest);
  assert.equal(calls, 1);
  pending.resolve({ role: "member" });
  assert.deepEqual(await focusRequest, {
    status: "fulfilled",
    value: { role: "member" },
    current: true,
  });
});

test("a superseding request aborts the old request and marks its late result stale", async () => {
  const requests = [];
  const coordinator = createRequestCoordinator((signal) => {
    const pending = deferred();
    requests.push({ signal, ...pending });
    return pending.promise;
  });

  const oldRequest = coordinator.run();
  const newRequest = coordinator.run({ supersede: true });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].signal.aborted, true);
  requests[0].resolve({ role: "member", email: "old@example.com" });
  requests[1].resolve({ role: "none" });
  assert.equal((await oldRequest).current, false);
  assert.deepEqual(await newRequest, {
    status: "fulfilled",
    value: { role: "none" },
    current: true,
  });
});

test("disposing the coordinator makes late responses stale and prevents new requests", async () => {
  const pending = deferred();
  const coordinator = createRequestCoordinator(() => pending.promise);
  const request = coordinator.run();

  coordinator.dispose();
  pending.resolve("late");

  assert.equal((await request).current, false);
  assert.throws(() => coordinator.run(), /disposed/i);
});

test("cancelling an in-flight request keeps the coordinator reusable", async () => {
  const requests = [];
  const coordinator = createRequestCoordinator((signal) => {
    const pending = deferred();
    requests.push({ signal, ...pending });
    return pending.promise;
  });
  const cancelledRequest = coordinator.run();

  coordinator.cancel();
  const retry = coordinator.run();

  assert.equal(requests[0].signal.aborted, true);
  requests[0].resolve("old");
  requests[1].resolve("new");
  assert.equal((await cancelledRequest).current, false);
  assert.deepEqual(await retry, { status: "fulfilled", value: "new", current: true });
});

test("request failures are returned as current outcomes and can be retried", async () => {
  let calls = 0;
  const coordinator = createRequestCoordinator(async () => {
    calls += 1;
    if (calls === 1) throw new Error("offline");
    return "ready";
  });

  const failed = await coordinator.run();
  const retried = await coordinator.run();

  assert.equal(failed.status, "rejected");
  assert.match(String(failed.reason), /offline/);
  assert.equal(failed.current, true);
  assert.deepEqual(retried, { status: "fulfilled", value: "ready", current: true });
  assert.equal(calls, 2);
});
