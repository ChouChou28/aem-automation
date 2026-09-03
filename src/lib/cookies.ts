/**
 * Cookie utilities.
 *
 * Supports the three formats the desktop tool accepts:
 *   - Netscape `cookies.txt`  (tab separated)
 *   - JSON array              (EditThisCookie / Puppeteer export)
 *   - a pasted cURL command   ("Import cURL")
 *
 * Browser note: a web page cannot set an arbitrary `Cookie:` header on a
 * cross-origin `fetch` (it is a forbidden header), so for same-origin / proxied
 * calls we rely on `credentials: "include"`. The parsed jar below is still the
 * single source of truth for the UI, for export, and for a dev proxy that can
 * replay the header server-side.
 */

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

/** Detect the format of a raw cookie file and parse it into a jar. */
export function parseCookieFile(raw: string): Cookie[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    return parseJsonCookies(trimmed);
  }
  return parseNetscape(trimmed);
}

function parseJsonCookies(raw: string): Cookie[] {
  try {
    const data = JSON.parse(raw);
    const list = Array.isArray(data) ? data : [data];
    return list
      .filter((c) => c && c.name)
      .map((c) => ({
        name: String(c.name),
        value: String(c.value ?? ""),
        domain: c.domain,
        path: c.path ?? "/",
        expires: c.expirationDate ?? c.expires,
        secure: Boolean(c.secure),
        httpOnly: Boolean(c.httpOnly),
        sameSite: c.sameSite,
      }));
  } catch {
    return [];
  }
}

function parseNetscape(raw: string): Cookie[] {
  const cookies: Cookie[] = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("\t");
    if (parts.length < 7) continue;
    const [domain, , path, secure, expires, name, value] = parts;
    cookies.push({
      domain,
      path,
      secure: secure.toUpperCase() === "TRUE",
      expires: Number(expires) || undefined,
      name,
      value,
    });
  }
  return cookies;
}

/** Extract cookies from a pasted cURL command ("Copy as cURL" in devtools). */
export function parseCurl(curl: string): Cookie[] {
  const cookies = new Map<string, Cookie>();
  const add = (segment: string) => {
    for (const pair of segment.split(";")) {
      const idx = pair.indexOf("=");
      if (idx === -1) continue;
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (name) cookies.set(name, { name, value, path: "/" });
    }
  };

  // -H 'Cookie: ...'
  const headerRe = /-H\s+(['"])\s*cookie\s*:\s*([\s\S]*?)\1/gi;
  let m: RegExpExecArray | null;
  while ((m = headerRe.exec(curl))) add(m[2]);

  // -b / --cookie 'name=value; ...'
  const bRe = /(?:-b|--cookie)\s+(['"])([\s\S]*?)\1/gi;
  while ((m = bRe.exec(curl))) add(m[2]);

  return [...cookies.values()];
}

/** Serialize a jar to a `Cookie:` header value. */
export function toCookieHeader(cookies: Cookie[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/** Serialize a jar to Netscape `cookies.txt` (for the Export button). */
export function toNetscape(cookies: Cookie[]): string {
  const header = "# Netscape HTTP Cookie File\n";
  const rows = cookies.map((c) =>
    [
      c.domain ?? "",
      c.domain?.startsWith(".") ? "TRUE" : "FALSE",
      c.path ?? "/",
      c.secure ? "TRUE" : "FALSE",
      c.expires ? String(Math.floor(c.expires)) : "0",
      c.name,
      c.value,
    ].join("\t")
  );
  return header + rows.join("\n") + "\n";
}
