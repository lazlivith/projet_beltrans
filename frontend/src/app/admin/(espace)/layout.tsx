import { AdminShell } from "@/components/admin/admin-shell";

/** Pages protégées : la session est vérifiée par AdminShell (et par l'API à chaque requête). */
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
