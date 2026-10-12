"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiClientError } from "@/lib/api-client";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) =>
          !(error instanceof ApiClientError && error.status >= 400 && error.status < 500) && failureCount < 2,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster position="top-center" richColors closeButton toastOptions={{ className: "font-sans" }} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
