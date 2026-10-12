import type { NextRequest } from "next/server";
import { backendUrl } from "@/lib/backend";

/**
 * Forwards every `/api/*` request to the backend. The browser only ever talks to the frontend's
 * origin, so the session cookie stays first-party (SameSite=Lax) and no CORS setup is needed.
 */
async function forward(request: NextRequest): Promise<Response> {
  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, backendUrl());

  const headers = new Headers(request.headers);
  for (const name of ["host", "connection", "content-length", "transfer-encoding"]) headers.delete(name);
  // The backend's same-origin check compares Origin with the host the browser used.
  headers.set("x-forwarded-host", request.headers.get("host") ?? request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      // @ts-expect-error `duplex` is required by Node's fetch when streaming a request body.
      duplex: hasBody ? "half" : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: { code: "BACKEND_UNAVAILABLE", message: "The service is temporarily unavailable. Please try again shortly." } },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers(upstream.headers);
  // fetch() already decoded the body, so these no longer describe it.
  for (const name of ["content-encoding", "content-length", "transfer-encoding", "connection"]) responseHeaders.delete(name);
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const HEAD = forward;
export const OPTIONS = forward;
