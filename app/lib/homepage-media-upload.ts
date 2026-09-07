const HOMEPAGE_UPLOAD_URL = "https://fluxora-prompt-gallery-media.ppopsoda3.workers.dev/homepage-upload";
const PUBLIC_MEDIA_PREFIX = "https://media.fluxora.wiki/";

async function errorMessage(response: Response) {
  try { return (await response.json()).error || `Upload failed (${response.status}).`; }
  catch { return `Upload failed (${response.status}).`; }
}

export async function uploadHomepageMedia(file: File, kind: "hero" | "tools", accessToken: string) {
  const signature = btoa(String.fromCharCode(...new Uint8Array(await file.slice(0, 12).arrayBuffer())));
  const authorization = await fetch("/api/homepage-media/authorize", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type, size: file.size, signature }),
  });
  if (!authorization.ok) throw new Error(await errorMessage(authorization));
  const grant = await authorization.json() as { token?: string; uploadUrl?: string; objectKey?: string };
  if (!grant.token || grant.uploadUrl !== HOMEPAGE_UPLOAD_URL || !grant.objectKey?.startsWith(`homepage/${kind}/`)) throw new Error("The upload authorization response is invalid.");
  const upload = await fetch(grant.uploadUrl, {
    method: "PUT",
    headers: { Authorization: `Bearer ${grant.token}`, "Content-Type": file.type },
    body: file,
  });
  if (!upload.ok) throw new Error(await errorMessage(upload));
  const result = await upload.json() as { url?: string };
  const expectedUrl = `${PUBLIC_MEDIA_PREFIX}${grant.objectKey.split("/").map(encodeURIComponent).join("/")}`;
  if (result.url !== expectedUrl) throw new Error("The media service returned an invalid URL.");
  return result.url;
}
