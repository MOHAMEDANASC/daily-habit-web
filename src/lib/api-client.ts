import type { ApiFailure, ApiSuccess } from "@/shared/api-types";

/** Error thrown by `apiFetch` for any non-2xx response, carrying the server's field errors. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiFetch<T>(path: string, init: Omit<RequestInit, "body"> & { body?: unknown } = {}): Promise<T> {
  const { body, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError("Can't reach the server. Check your connection and try again.", 0, "NETWORK_ERROR");
  }

  let payload: ApiSuccess<T> | ApiFailure | null = null;
  try {
    payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    // non-JSON body (e.g. a proxy error page)
  }

  if (!response.ok || !payload || "error" in payload) {
    const failure = payload && "error" in payload ? payload.error : undefined;
    if (response.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth/")) {
      // A full navigation also clears all client-side caches of the previous session.
      window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    throw new ApiClientError(
      failure?.message ?? "Something went wrong. Please try again.",
      response.status,
      failure?.code ?? "UNKNOWN",
      failure?.details,
    );
  }
  return payload.data;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body: body ?? {} }),
  patch: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "DELETE", body }),
};

export function queryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
