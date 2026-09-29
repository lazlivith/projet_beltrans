"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";

/**
 * Nombre de demandes « Nouveau » à traiter : pastille du menu + titre de l'onglet.
 * Rafraîchi chaque minute tant que l'onglet est visible. La clé commence par
 * ["admin", "quotes"] : toute modification de devis l'invalide automatiquement.
 */
export function usePendingCount() {
  return useQuery({
    queryKey: ["admin", "quotes", "pending-count"],
    queryFn: async () => (await adminApi.quotes({ status: "PENDING", pageSize: 1 })).total,
    refetchInterval: 60_000,
  });
}

/** Précharge la fiche d'un devis (survol / focus d'une ligne) : ouverture instantanée. */
export function usePrefetchQuote() {
  const queryClient = useQueryClient();
  return (id: string) =>
    queryClient.prefetchQuery({
      queryKey: ["admin", "quote", id],
      queryFn: () => adminApi.quote(id),
      staleTime: 30_000,
    });
}
