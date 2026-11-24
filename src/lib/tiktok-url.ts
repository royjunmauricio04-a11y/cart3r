// SSRF-safe TikTok URL handling. Only allowlisted hosts are ever fetched.
const HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const SHORT = new Set(["vm.tiktok.com", "vt.tiktok.com"]);

export type ParsedVideo = { canonicalUrl: string; videoId: string; handle: string };

function safeUrl(raw: string, hosts: Set<string>): URL | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  return hosts.has(u.hostname.toLowerCase()) ? u : null;
}

export function parseTikTokUrl(raw: string): ParsedVideo | null {
  const u = safeUrl(raw, HOSTS);
  const m = u?.pathname.match(/^\/@([\w.]{1,64})\/video\/(\d{6,25})\/?$/);
  if (!m) return null;
  return { canonicalUrl: `https://www.tiktok.com/@${m[1]}/video/${m[2]}`, videoId: m[2], handle: m[1] };
}

export function isShortLink(raw: string) { return !!safeUrl(raw, SHORT); }

/** Follows up to 3 redirects manually; every hop must be an allowlisted TikTok host. */
export async function resolveShortLink(raw: string): Promise<ParsedVideo | null> {
  let current = raw;
  for (let i = 0; i < 3; i++) {
    const direct = parseTikTokUrl(current);
    if (direct) return direct;
    if (!isShortLink(current) && !safeUrl(current, HOSTS)) return null;
    const res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(5000) });
    const loc = res.headers.get("location");
    if (!loc) return null;
    current = new URL(loc, current).toString();
  }
  return parseTikTokUrl(current);
}

/** Official public oEmbed endpoint. Host is fixed; user input is only a query value. */
export async function fetchOEmbed(canonicalUrl: string) {
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null; // private, removed, or unavailable
  const j = (await res.json()) as { title?: string; author_unique_id?: string; thumbnail_url?: string };
  return { title: j.title ?? null, creatorHandle: j.author_unique_id ?? null, thumbnailUrl: j.thumbnail_url ?? null };
}
