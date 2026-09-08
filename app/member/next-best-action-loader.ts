type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export type NextBestActionDecision<T> =
  | { kind: "retention" }
  | { kind: "unauthorized" }
  | { kind: "recommendation"; data: T | null }
  | { kind: "error"; message: string };

const requestOptions: RequestInit = {
  cache: "no-store",
  credentials: "include",
};

function isAbortError(reason: unknown, signal?: AbortSignal) {
  return Boolean(signal?.aborted) || (reason instanceof Error && reason.name === "AbortError");
}

export async function loadNextBestActionDecision<T = unknown>(
  fetcher: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<NextBestActionDecision<T>> {
  const options = { ...requestOptions, signal };
  let retentionResponse: Response | null = null;
  try {
    retentionResponse = await fetcher("/prompts/api/retention", options);
  } catch (reason) {
    if (isAbortError(reason, signal)) throw reason;
  }
  if (retentionResponse?.ok) {
    const retentionBody = (await retentionResponse.json().catch(() => ({}))) as { retention?: { eligible?: boolean } | null };
    if (retentionBody.retention?.eligible) return { kind: "retention" };
  }

  try {
    const response = await fetcher("/prompts/api/next-best-action", options);
    if (response.status === 401) return { kind: "unauthorized" };

    const body = (await response.json().catch(() => ({}))) as { nextBestAction?: T | null; error?: string };
    if (!response.ok) {
      return { kind: "error", message: body.error || "Could not choose your next action." };
    }
    return { kind: "recommendation", data: body.nextBestAction || null };
  } catch (reason) {
    if (isAbortError(reason, signal)) throw reason;
    return {
      kind: "error",
      message: reason instanceof Error ? reason.message : "Could not choose your next action.",
    };
  }
}
