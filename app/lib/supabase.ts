export type SupabaseUser = {
  id: string;
  email?: string;
};

export type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in?: number;
  token_type?: string;
  user: SupabaseUser;
};

export type ApiResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

const SESSION_KEY = "fluxora-supabase-session";

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

export function isSupabaseConfigured() {
  const { url, key } = getConfig();
  return Boolean(url && key);
}

function readStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function parseError(response: Response) {
  try {
    const body = await response.json();
    return body?.message || body?.msg || body?.error_description || body?.error || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

async function refreshSession(session: SupabaseSession): Promise<SupabaseSession | null> {
  const { url, key } = getConfig();
  if (!url || !key || !session.refresh_token) return null;

  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });

  if (!response.ok) {
    storeSession(null);
    return null;
  }

  const body = await response.json();
  const nextSession: SupabaseSession = {
    ...body,
    expires_at: Math.floor(Date.now() / 1000) + Number(body.expires_in || 3600),
  };
  storeSession(nextSession);
  return nextSession;
}

export async function getSession(): Promise<SupabaseSession | null> {
  const session = readStoredSession();
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at > now + 45) return session;
  return refreshSession(session);
}

export async function signInWithPassword(email: string, password: string): Promise<ApiResult<SupabaseSession>> {
  const { url, key } = getConfig();
  if (!url || !key) return { data: null, error: { message: "Supabase environment variables are missing." } };

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) return { data: null, error: { message: await parseError(response) } };
  const body = await response.json();
  const session: SupabaseSession = {
    ...body,
    expires_at: Math.floor(Date.now() / 1000) + Number(body.expires_in || 3600),
  };
  storeSession(session);
  return { data: session, error: null };
}

export function signOut() {
  storeSession(null);
}

async function restRequest<T>(
  table: string,
  query: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown>;
    authenticated?: boolean;
    prefer?: string;
  } = {},
): Promise<ApiResult<T>> {
  const { url, key } = getConfig();
  if (!url || !key) return { data: null, error: { message: "Supabase environment variables are missing." } };

  const headers: Record<string, string> = {
    apikey: key,
    "Content-Type": "application/json",
  };

  if (options.authenticated) {
    const session = await getSession();
    if (!session) return { data: null, error: { message: "Your admin session has expired. Sign in again." } };
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  if (options.prefer) headers.Prefer = options.prefer;

  const response = await fetch(`${url}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) return { data: null, error: { message: await parseError(response) } };
  if (response.status === 204) return { data: null, error: null };

  const text = await response.text();
  return { data: (text ? JSON.parse(text) : null) as T, error: null };
}

export function queryRows<T>(table: string, query: string, authenticated = false) {
  return restRequest<T[]>(table, query, { authenticated });
}

export async function queryOne<T>(table: string, query: string, authenticated = false): Promise<ApiResult<T>> {
  const result = await queryRows<T>(table, `${query}${query ? "&" : ""}limit=1`, authenticated);
  if (result.error) return { data: null, error: result.error };
  return { data: result.data?.[0] || null, error: null };
}

export async function insertRow<T>(table: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  const result = await restRequest<T[]>(table, "", {
    method: "POST",
    body,
    authenticated: true,
    prefer: "return=representation",
  });
  return { data: result.data?.[0] || null, error: result.error };
}

export async function updateRow<T>(table: string, id: string, body: Record<string, unknown>): Promise<ApiResult<T>> {
  const result = await restRequest<T[]>(table, `id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body,
    authenticated: true,
    prefer: "return=representation",
  });
  return { data: result.data?.[0] || null, error: result.error };
}

export function deleteRow(table: string, id: string) {
  return restRequest<null>(table, `id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export async function upsertRow<T>(table: string, body: Record<string, unknown>, conflictColumn: string): Promise<ApiResult<T>> {
  const result = await restRequest<T[]>(table, `on_conflict=${encodeURIComponent(conflictColumn)}`, {
    method: "POST",
    body,
    authenticated: true,
    prefer: "resolution=merge-duplicates,return=representation",
  });
  return { data: result.data?.[0] || null, error: result.error };
}
