import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserDTO } from "@/shared/api-types";
import { backendUrl } from "@/lib/backend";

const SESSION_COOKIE = "habit_session";

/**
 * The signed-in user, asked of the backend with the visitor's session cookie (null when signed out).
 * The backend checks the session against the database, so the cookie alone is never trusted.
 * A backend that is down throws instead of looking like "signed out".
 */
export const getCurrentUser = cache(async (): Promise<UserDTO | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const response = await fetch(`${backendUrl()}/api/me`, {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
    cache: "no-store",
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error(`The backend could not verify the session (HTTP ${response.status}).`);
  const body = (await response.json()) as { data: { user: UserDTO } };
  return body.data.user;
});

/** For Server Components: redirect to the login page when nobody is signed in. */
export async function requireUser(): Promise<UserDTO> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
