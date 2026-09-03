import { toCookieHeader, type Cookie } from "@/lib/cookies";
import { handleAuthFailure } from "@/hooks/use-cookie-bridge";

export interface ApiRequest {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** A plain object is JSON-encoded; a FormData is sent as multipart as-is. */
  body?: unknown;
  headers?: Record<string, string>;
  /** Parsed cookie jar to replay (honored by the same-origin dev proxy). */
  cookies?: Cookie[];
  signal?: AbortSignal;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  /** True when the response indicates an expired/invalid session. */
  authFailed?: boolean;
}

const AEM_HOST = /^https?:\/\/p6-ap-author\.samsung\.com/i;

/**
 * Detect an AEM authentication failure from either the HTTP status or a body
 * such as `{statusCode:500, statusMessage:"Authentication Fail"}`.
 */
export function isAuthFailure(data: unknown, status: number): boolean {
  if (status === 401 || status === 403) return true;
  if (typeof data === "string") return /authentication\s*fail/i.test(data);
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const msg = String(d.statusMessage ?? d.message ?? d.data ?? d.error ?? "");
    if (/authentication\s*fail/i.test(msg)) return true;
    if (d.statusCode === 401 || d.statusCode === 403) return true;
  }
  return false;
}

/**
 * Pull a human-readable message from an error response, e.g. the AEM/JIRA
 * `statusMessage`, so the activity log shows the real reason instead of a
 * generic "HTTP 500".
 */
export function extractMessage(data: unknown): string | undefined {
  if (typeof data === "string") return data.trim() || undefined;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const msg = d.statusMessage ?? d.message ?? d.data ?? d.error;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return undefined;
}

/**
 * In dev, rewrite absolute AEM URLs to the same-origin `/aem` proxy so cookie
 * replay + CORS work (see vite.config.ts). In prod the URL is left untouched
 * (a real backend / proxy must stand in for the dev server).
 */
export function resolveUrl(url: string): string {
  if (import.meta.env.DEV) return url.replace(AEM_HOST, "/aem");
  return url;
}

/**
 * Thin fetch wrapper that authenticates with cookies. Same-origin requests
 * carry the parsed jar on `x-replay-cookie`, which the dev proxy turns into a
 * real `Cookie:` header; the browser also includes its own cookies via
 * `credentials: "include"`.
 */
export async function apiRequest<T = unknown>(
  req: ApiRequest
): Promise<ApiResult<T>> {
  const { method = "GET", body, headers = {}, cookies, signal } = req;
  const url = resolveUrl(req.url);
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json, text/javascript, */*; q=0.01",
    ...headers,
  };
  // Never set Content-Type for FormData — the browser adds the boundary.
  if (body !== undefined && !isForm) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (cookies?.length) finalHeaders["x-replay-cookie"] = toCookieHeader(cookies);

  try {
    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : isForm
            ? (body as FormData)
            : JSON.stringify(body),
      signal,
    });

    const text = await res.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      data = text as unknown as T;
    }

    // The endpoint can return an auth failure either as an HTTP 401/403 or as a
    // 200/500 body like {statusCode:500, statusMessage:"Authentication Fail"}.
    // Surface it as a sync popup instead of a silent failure.
    const authFailed = isAuthFailure(data, res.status);
    const serverMsg = extractMessage(data);
    if (authFailed) {
      // Auth failure → silently re-sync cookies (no popup).
      handleAuthFailure();
    }

    return {
      ok: res.ok && !authFailed,
      status: res.status,
      data,
      authFailed,
      // Prefer the server's own message (statusMessage) over a generic HTTP line.
      error: authFailed
        ? serverMsg || "Authentication Fail"
        : res.ok
          ? undefined
          : serverMsg || `HTTP ${res.status} ${res.statusText}`,
    };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      return { ok: false, status: 0, data: null, error: "Aborted" };
    }
    return {
      ok: false,
      status: 0,
      data: null,
      error: (err as Error).message || "Network error",
    };
  }
}
