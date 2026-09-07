export type MemberPortalMember = {
  tier?: string;
  status?: string;
  expires_at?: string | null;
  creator_preview_active?: boolean;
  creator_preview_expires_at?: string | null;
  effective_access?: string;
};

export type MemberPortalResponse = {
  role?: "admin" | "member" | "free" | "none";
  email?: string;
  member?: MemberPortalMember;
  error?: string;
};

type MemberPortalResult = {
  ok: boolean;
  status: number;
  body: MemberPortalResponse;
};

const CACHE_TTL_MS = 15_000;
let cachedResult: MemberPortalResult | null = null;
let cachedAt = 0;
let inFlight: Promise<MemberPortalResult> | null = null;

async function requestMemberPortal(): Promise<MemberPortalResult> {
  const response = await fetch("/prompts/api/member-portal", {
    cache: "no-store",
    credentials: "include",
  });
  const body = (await response.json().catch(() => ({}))) as MemberPortalResponse;
  return { ok: response.ok, status: response.status, body };
}

export async function fetchMemberPortal(options: { force?: boolean } = {}): Promise<MemberPortalResult> {
  const now = Date.now();
  if (!options.force && cachedResult && now - cachedAt < CACHE_TTL_MS) return cachedResult;
  if (inFlight) return inFlight;

  inFlight = requestMemberPortal()
    .then((result) => {
      if (result.ok) {
        cachedResult = result;
        cachedAt = Date.now();
      } else {
        cachedResult = null;
        cachedAt = 0;
      }
      return result;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function clearMemberPortalCache() {
  cachedResult = null;
  cachedAt = 0;
}
