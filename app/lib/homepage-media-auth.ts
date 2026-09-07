import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const HOMEPAGE_MEDIA_MAX_BYTES = 10 * 1024 * 1024;
const TOKEN_TTL_SECONDS = 300;
const TYPES = {
  "image/jpeg": { extension: "jpg", signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: "png", signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) },
  "image/webp": { extension: "webp", signature: (bytes: Buffer) => bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" },
  "image/gif": { extension: "gif", signature: (bytes: Buffer) => ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString()) },
} as const;

export type HomepageMediaKind = "hero" | "tools";
export type HomepageUploadClaims = {
  operation: "upload-homepage";
  kind: HomepageMediaKind;
  objectKey: string;
  contentType: keyof typeof TYPES;
  size: number;
  exp: number;
};

type UploadRequest = { kind?: unknown; contentType?: unknown; size?: unknown; signature?: unknown };

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function exactClaims(value: unknown): value is HomepageUploadClaims {
  if (!value || typeof value !== "object") return false;
  const claim = value as Record<string, unknown>;
  const keys = Object.keys(claim).sort().join(",");
  return keys === "contentType,exp,kind,objectKey,operation,size" &&
    claim.operation === "upload-homepage" &&
    (claim.kind === "hero" || claim.kind === "tools") &&
    typeof claim.contentType === "string" && claim.contentType in TYPES &&
    Number.isSafeInteger(claim.size) && Number(claim.size) > 0 && Number(claim.size) <= HOMEPAGE_MEDIA_MAX_BYTES &&
    Number.isSafeInteger(claim.exp) &&
    typeof claim.objectKey === "string" && validHomepageObjectKey(claim.objectKey, claim.kind, claim.contentType as keyof typeof TYPES);
}

function validHomepageObjectKey(key: string, kind: HomepageMediaKind, contentType: keyof typeof TYPES) {
  return new RegExp(`^homepage/${kind}/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.${TYPES[contentType].extension}$`, "i").test(key);
}

export async function authorizeHomepageUpload(input: UploadRequest, secret: string, now = Math.floor(Date.now() / 1000), makeUuid = randomUUID) {
  if (secret.length < 32) throw new Error("Homepage media signing is not configured.");
  if (input.kind !== "hero" && input.kind !== "tools") throw new Error("Invalid homepage media kind.");
  if (typeof input.contentType !== "string" || !(input.contentType in TYPES)) throw new Error("Unsupported image type.");
  if (!Number.isSafeInteger(input.size) || Number(input.size) <= 0) throw new Error("An empty image cannot be uploaded.");
  if (Number(input.size) > HOMEPAGE_MEDIA_MAX_BYTES) throw new Error("Image is too large.");
  if (typeof input.signature !== "string") throw new Error("Image signature is missing.");
  const bytes = Buffer.from(input.signature, "base64");
  const type = input.contentType as keyof typeof TYPES;
  if (!TYPES[type].signature(bytes)) throw new Error("Image signature does not match its content type.");
  const claims: HomepageUploadClaims = {
    operation: "upload-homepage",
    kind: input.kind,
    objectKey: `homepage/${input.kind}/${makeUuid()}.${TYPES[type].extension}`,
    contentType: type,
    size: Number(input.size),
    exp: now + TOKEN_TTL_SECONDS,
  };
  const payload = encode(JSON.stringify(claims));
  return { claims, token: `${payload}.${sign(payload, secret)}` };
}

export async function verifyHomepageUploadToken(token: string, secret: string, now = Math.floor(Date.now() / 1000)) {
  if (secret.length < 32) throw new Error("Homepage media signing is not configured.");
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra || signature.length > 128) throw new Error("Invalid token signature.");
  const expected = sign(payload, secret);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) throw new Error("Invalid token signature.");
  let claims: unknown;
  try { claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")); } catch { throw new Error("Invalid upload claims."); }
  if (!exactClaims(claims)) throw new Error("Invalid upload claims.");
  if (claims.exp < now) throw new Error("Upload authorization has expired.");
  if (claims.exp > now + TOKEN_TTL_SECONDS) throw new Error("Invalid upload expiry.");
  return claims;
}

export async function requireSiteAdmin(accessToken: string, config: { url: string; key: string }, fetcher: typeof fetch = fetch) {
  if (!accessToken || accessToken.length > 4096 || !config.url || !config.key) throw new Error("Unauthorized.");
  const headers = { apikey: config.key, Authorization: `Bearer ${accessToken}` };
  const userResponse = await fetcher(`${config.url.replace(/\/$/, "")}/auth/v1/user`, { headers, cache: "no-store" });
  if (!userResponse.ok) throw new Error("Unauthorized.");
  const user = await userResponse.json() as { id?: string };
  if (!user.id) throw new Error("Unauthorized.");
  const adminResponse = await fetcher(`${config.url.replace(/\/$/, "")}/rest/v1/site_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, { headers, cache: "no-store" });
  if (!adminResponse.ok) throw new Error("Admin authorization failed.");
  const admins = await adminResponse.json() as Array<{ user_id?: string }>;
  if (admins.length !== 1 || admins[0]?.user_id !== user.id) throw new Error("This user is not a site admin.");
  return user.id;
}
