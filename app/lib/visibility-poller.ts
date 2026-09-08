type PollingTimer = ReturnType<typeof setInterval> | number;

type VisibilityPollerOptions = {
  load: () => Promise<unknown>;
  intervalMs: number;
  now?: () => number;
  isVisible?: () => boolean;
  schedule?: (callback: () => Promise<boolean>, intervalMs: number) => PollingTimer;
  clearSchedule?: (timer: PollingTimer) => void;
  subscribeVisibility?: (callback: () => Promise<boolean>) => () => void;
};

export function createVisibilityPoller({
  load,
  intervalMs,
  now = Date.now,
  isVisible = () => document.visibilityState === "visible",
  schedule = (callback, delay) => window.setInterval(callback, delay),
  clearSchedule = (timer) => window.clearInterval(timer as number),
  subscribeVisibility = (callback) => {
    const handler = () => void callback();
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  },
}: VisibilityPollerOptions) {
  let stopped = true;
  let inFlight = false;
  let lastStartedAt = Number.NEGATIVE_INFINITY;
  let timer: PollingTimer | null = null;
  let unsubscribe: (() => void) | null = null;

  async function refresh(force = false) {
    if (stopped || inFlight || !isVisible()) return false;
    if (!force && now() - lastStartedAt < intervalMs) return false;

    inFlight = true;
    lastStartedAt = now();
    try {
      await load();
    } finally {
      inFlight = false;
    }
    return true;
  }

  function start() {
    if (!stopped) return Promise.resolve(false);
    stopped = false;
    timer = schedule(() => refresh(false), intervalMs);
    unsubscribe = subscribeVisibility(() => refresh(false));
    return refresh(true);
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    if (timer !== null) clearSchedule(timer);
    unsubscribe?.();
    timer = null;
    unsubscribe = null;
  }

  return { start, refresh, stop };
}
