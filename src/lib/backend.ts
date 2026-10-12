import "server-only";

/** Where the backend API runs. Read at request time, so it can differ per environment. */
export function backendUrl(): string {
  return (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/+$/, "");
}
