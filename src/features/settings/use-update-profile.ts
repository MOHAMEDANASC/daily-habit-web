"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { UpdateProfileInput } from "@/shared/validations/auth";
import type { UserDTO } from "@/shared/api-types";

/** Update the signed-in user, then refresh server components so the shell sees the new values. */
export function useUpdateProfile(successMessage = "Saved") {
  const router = useRouter();
  return useMutation({
    mutationFn: (patch: UpdateProfileInput) => api.patch<{ user: UserDTO }>("/api/me", patch),
    onSuccess: () => {
      toast.success(successMessage);
      router.refresh();
    },
  });
}
