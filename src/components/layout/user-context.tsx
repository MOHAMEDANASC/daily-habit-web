"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserDTO } from "@/shared/api-types";

const UserContext = createContext<UserDTO | null>(null);

export function UserProvider({ user, children }: { user: UserDTO; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/** The signed-in user, as resolved by the server in the dashboard layout. */
export function useUser(): UserDTO {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used inside the dashboard layout.");
  return user;
}
