import { resolveConfiguredLocalApiProxyTarget } from "@/lib/dev/local-api-proxy";
import { NextResponse } from "next/server";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/** Same-origin browser → Next. Ne pas relayer Origin/CORS vers le backend loopback. */
const STRIP_REQUEST = new Set(["origin", "referer"]);
const STRIP_RESPONSE = new Set(["access-control-allow-origin", "access-control-allow-credentials", "access-control-expose-headers"]);

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function isSafePathSegment(segment: string): boolean {
  return segment.length > 0 && segment !== "." && segment !== ".." && !segment.includes("\\");
}

async function proxyApiRequest(request: Request, path: string[]): Promise<Response> {
  const target = resolveConfiguredLocalApiProxyTarget();
  if (!target) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  if (path.length === 0 || !path.every(isSafePathSegment)) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  const incoming = new URL(request.url);
  const destination = `${target}/api/v1/${path.map(encodeURIComponent).join("/")}${incoming.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP.has(lower) && !STRIP_REQUEST.has(lower)) {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(destination, init);
  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || STRIP_RESPONSE.has(lower) || lower === "set-cookie") {
      return;
    }
    responseHeaders.set(key, value);
  });
  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    responseHeaders.append("set-cookie", cookie);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  return proxyApiRequest(request, (await context.params).path);
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  return proxyApiRequest(request, (await context.params).path);
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  return proxyApiRequest(request, (await context.params).path);
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  return proxyApiRequest(request, (await context.params).path);
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  return proxyApiRequest(request, (await context.params).path);
}

export async function HEAD(request: Request, context: RouteContext): Promise<Response> {
  return proxyApiRequest(request, (await context.params).path);
}

export async function OPTIONS(request: Request, context: RouteContext): Promise<Response> {
  return proxyApiRequest(request, (await context.params).path);
}
