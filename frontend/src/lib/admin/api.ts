import type {
  AdminMe,
  AdminQuoteDetail,
  AdminQuoteListQuery,
  AdminQuoteListResponse,
  AdminQuotePatch,
  AdminStats,
} from "@beltrans/shared";
import { apiUrl } from "@/lib/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Appel à l'API admin : le cookie de session (httpOnly) est envoyé automatiquement. */
async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(apiUrl(`/api/v1/admin${path}`), {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "Serveur injoignable. Vérifiez votre connexion.");
  }
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, body.error ?? "Une erreur est survenue.");
  return body as T;
}

export function toQueryString(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const adminApi = {
  login: (email: string, password: string) =>
    adminFetch<AdminMe>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => adminFetch<void>("/auth/logout", { method: "POST" }),
  me: () => adminFetch<AdminMe>("/auth/me"),
  stats: (range: { from?: string; to?: string }) =>
    adminFetch<AdminStats>(`/stats${toQueryString(range)}`),
  quotes: (query: AdminQuoteListQuery) =>
    adminFetch<AdminQuoteListResponse>(`/quotes${toQueryString(query)}`),
  quote: (id: string) => adminFetch<AdminQuoteDetail>(`/quotes/${encodeURIComponent(id)}`),
  updateQuote: (id: string, patch: AdminQuotePatch) =>
    adminFetch<AdminQuoteDetail>(`/quotes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  /** URL de téléchargement (navigation directe : le navigateur gère le fichier). */
  /** Modèle de devis Excel pré-rempli (à compléter puis envoyer au client). */
  quoteTemplateUrl: (id: string) =>
    apiUrl(`/api/v1/admin/quotes/${encodeURIComponent(id)}/devis.xlsx`),
  exportUrl: (query: AdminQuoteListQuery) =>
    apiUrl(
      `/api/v1/admin/quotes/export.xlsx${toQueryString({ ...query, page: undefined, pageSize: undefined })}`,
    ),
};
