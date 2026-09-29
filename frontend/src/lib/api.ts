/** URL de l'API backend (Express). Variable publique, injectée au build. */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}
