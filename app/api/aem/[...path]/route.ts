import type { NextRequest } from "next/server";

const AEM_ORIGIN = "https://p6-ap-author.samsung.com";
const FORWARDED_REQUEST_HEADERS = ["accept", "content-type", "x-requested-with"] as const;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const target = new URL(path.map(encodeURIComponent).join("/"), `${AEM_ORIGIN}/`);
  target.search = request.nextUrl.search;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const replayCookie = request.headers.get("x-replay-cookie");
  if (replayCookie) headers.set("cookie", replayCookie);
  headers.set("origin", AEM_ORIGIN);
  headers.set("referer", `${AEM_ORIGIN}/`);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    responseHeaders.set("cache-control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AEM request failed";
    return Response.json({ statusMessage: message }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
