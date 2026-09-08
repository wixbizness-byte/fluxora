export type RequestOutcome<T> =
  | { status: "fulfilled"; value: T; current: boolean }
  | { status: "rejected"; reason: unknown; current: boolean };

export function createRequestCoordinator<T>(request: (signal: AbortSignal) => Promise<T>) {
  let generation = 0;
  let disposed = false;
  let active: { controller: AbortController; promise: Promise<RequestOutcome<T>> } | null = null;

  function run(options: { supersede?: boolean } = {}) {
    if (disposed) throw new Error("Request coordinator has been disposed.");
    if (active && !options.supersede) return active.promise;

    if (active) active.controller.abort();
    const controller = new AbortController();
    const requestGeneration = ++generation;
    let promise: Promise<RequestOutcome<T>>;

    try {
      promise = request(controller.signal).then(
        (value): RequestOutcome<T> => ({
          status: "fulfilled",
          value,
          current: !disposed && requestGeneration === generation,
        }),
        (reason): RequestOutcome<T> => ({
          status: "rejected",
          reason,
          current: !disposed && requestGeneration === generation,
        }),
      );
    } catch (reason) {
      promise = Promise.resolve({
        status: "rejected",
        reason,
        current: !disposed && requestGeneration === generation,
      });
    }

    promise = promise.finally(() => {
      if (active?.promise === promise) active = null;
    });
    active = { controller, promise };
    return promise;
  }

  function cancel() {
    generation += 1;
    active?.controller.abort();
    active = null;
  }

  function dispose() {
    if (disposed) return;
    cancel();
    disposed = true;
  }

  return { run, cancel, dispose };
}
