"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, LayoutDashboard, LogOut, type LucideIcon } from "lucide-react";
import { usePendingCount } from "@/components/admin/hooks";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { adminApi, ApiError } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: boolean };

const NAV: NavItem[] = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/devis", label: "Demandes de devis", icon: FileText, badge: true },
];

function PendingBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] leading-5 font-bold text-ink tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
      <span className="sr-only">
        {" "}
        nouvelle{count > 1 ? "s" : ""} demande{count > 1 ? "s" : ""}
      </span>
    </span>
  );
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

/** Gabarit de l'espace admin : vérifie la session, puis navigation aux couleurs BELTRANS. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: adminApi.me, staleTime: 5 * 60_000 });
  const pending = usePendingCount();
  const pendingCount = pending.data ?? 0;

  const logout = useMutation({
    mutationFn: adminApi.logout,
    onSettled: () => {
      queryClient.clear();
      router.replace("/admin/login");
    },
  });

  const unauthenticated = me.error instanceof ApiError && me.error.status === 401;
  useEffect(() => {
    if (unauthenticated) router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [unauthenticated, pathname, router]);

  // Titre de l'onglet : « (3) Espace admin » quand des demandes attendent
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = pendingCount ? `(${pendingCount}) ${base}` : base;
  }, [pendingCount, pathname]);

  if (me.isPending || unauthenticated) {
    return (
      <div
        className="flex min-h-dvh bg-surface"
        role="status"
        aria-label="Vérification de la session"
      >
        <div className="hidden w-64 bg-ink lg:block" />
        <div className="flex-1 space-y-4 p-6 lg:p-10">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-line" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (me.isError) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
        role="alert"
      >
        <p className="font-semibold text-danger">{me.error.message}</p>
        <Button onClick={() => me.refetch()}>Réessayer</Button>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-surface lg:pl-64">
      {/* ── Barre latérale (desktop) ── */}
      <aside className="on-dark fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink text-white lg:flex">
        <div className="px-5 pt-6 pb-5">
          <Link
            href="/admin"
            className="block rounded-xl bg-white px-3 py-2.5"
            aria-label="Tableau de bord"
          >
            <Logo className="mx-auto h-10" />
          </Link>
          <p className="mt-3 text-center text-[11px] font-semibold tracking-[0.2em] text-gold uppercase">
            Espace admin
          </p>
        </div>

        <nav aria-label="Navigation admin" className="flex-1 px-3">
          <ul className="space-y-1">
            {NAV.map(({ href, label, icon: Icon, badge }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-white/10 text-white"
                        : "text-white/65 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {active && (
                      <span
                        className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gold"
                        aria-hidden="true"
                      />
                    )}
                    <Icon className={cn("size-[18px]", active && "text-gold")} aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    {badge && <PendingBadge count={pendingCount} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            Voir le site
            <span className="sr-only"> (nouvel onglet)</span>
          </Link>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold"
              aria-hidden="true"
            >
              {initials(me.data.email)}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-white/70" title={me.data.email}>
              {me.data.email}
            </span>
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Barre supérieure (mobile / tablette) ── */}
      <header className="on-dark sticky top-0 z-30 flex h-14 items-center gap-3 bg-ink px-4 lg:hidden">
        <Link href="/admin" className="rounded-lg bg-white px-2 py-1" aria-label="Tableau de bord">
          <Logo className="h-7" />
        </Link>
        <span className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
          Admin
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/"
            target="_blank"
            className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Voir le site (nouvel onglet)"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Se déconnecter"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main
        id="contenu"
        className="mx-auto w-full max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12"
      >
        {children}
      </main>

      {/* ── Onglets (mobile / tablette) ── */}
      <nav
        aria-label="Navigation admin"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-brand" : "text-muted",
              )}
            >
              {active && (
                <span className="absolute top-0 h-0.5 w-10 rounded-b bg-gold" aria-hidden="true" />
              )}
              <span className="relative">
                <Icon className="size-5" aria-hidden="true" />
                {badge && (
                  <PendingBadge count={pendingCount} className="absolute -top-1.5 left-3.5" />
                )}
              </span>
              {label === "Demandes de devis" ? "Devis" : label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
