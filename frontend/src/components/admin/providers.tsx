"use client";

import { useState } from "react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/admin/toast";
import { ApiError } from "@/lib/admin/api";

/** Session expirée ou révoquée : retour à l'écran de connexion, en revenant ensuite ici. */
function redirectToLogin(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 401 &&
    !location.pathname.startsWith("/admin/login")
  ) {
    location.assign(`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`);
  }
}

export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: redirectToLogin }),
        mutationCache: new MutationCache({ onError: redirectToLogin }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true, // nouvelles demandes visibles en revenant sur l'onglet
            retry: (count, error) =>
              !(error instanceof ApiError && error.status < 500) && count < 2,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
