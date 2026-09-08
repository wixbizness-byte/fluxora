import assert from "node:assert/strict";
import test from "node:test";

import { loadNextBestActionDecision } from "../app/member/next-best-action-loader.ts";

const recommendation = {
  action: {
    code: "discover",
    category: "discovery",
    priority: 1,
    title: "Try a tool",
    description: "Open one useful tool.",
    cta: "Open",
    href: "/tools",
    reason: "Useful next step",
  },
  signals: {},
};

test("eligible retention skips the expensive recommendation request", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    return Response.json({ retention: { eligible: true } });
  };

  const result = await loadNextBestActionDecision(fetcher);

  assert.deepEqual(calls, ["/prompts/api/retention"]);
  assert.deepEqual(result, { kind: "retention" });
});

test("noneligible retention loads the recommendation after the precedence decision", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (url.endsWith("/retention")) return Response.json({ retention: { eligible: false } });
    return Response.json({ nextBestAction: recommendation });
  };

  const result = await loadNextBestActionDecision(fetcher);

  assert.deepEqual(calls, ["/prompts/api/retention", "/prompts/api/next-best-action"]);
  assert.deepEqual(result, { kind: "recommendation", data: recommendation });
});

test("a failed retention check falls back to a recommendation", async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (url.endsWith("/retention")) throw new Error("retention offline");
    return Response.json({ nextBestAction: recommendation });
  };

  const result = await loadNextBestActionDecision(fetcher);

  assert.equal(result.kind, "recommendation");
  assert.deepEqual(calls, ["/prompts/api/retention", "/prompts/api/next-best-action"]);
});

test("an unauthorized recommendation response is explicit", async () => {
  const fetcher = async (url) => url.endsWith("/retention")
    ? Response.json({ retention: { eligible: false } })
    : Response.json({ error: "Unauthorized" }, { status: 401 });

  assert.deepEqual(await loadNextBestActionDecision(fetcher), { kind: "unauthorized" });
});

test("a failed recommendation returns its API error", async () => {
  const fetcher = async (url) => url.endsWith("/retention")
    ? new Response(null, { status: 503 })
    : Response.json({ error: "Recommendation unavailable" }, { status: 503 });

  assert.deepEqual(await loadNextBestActionDecision(fetcher), {
    kind: "error",
    message: "Recommendation unavailable",
  });
});

test("aborting retention prevents an abandoned flow from reaching the recommendation", async () => {
  const calls = [];
  const controller = new AbortController();
  const fetcher = async (url, init = {}) => {
    calls.push(url);
    if (url.endsWith("/retention")) {
      if (!init.signal) return Response.json({ retention: { eligible: false } });
      return new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
      });
    }
    return Response.json({ nextBestAction: recommendation });
  };

  const request = loadNextBestActionDecision(fetcher, controller.signal);
  controller.abort();

  await assert.rejects(request, { name: "AbortError" });
  assert.deepEqual(calls, ["/prompts/api/retention"]);
});
