"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Phase = "idle" | "loading" | "done";

/** Doit-on considérer ce clic comme une navigation interne vers une autre page ? */
function isInternalNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const anchor = (event.target as Element | null)?.closest?.("a");
  if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return false;

  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  // Même page (ancre #…) : pas de chargement
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

/**
 * Barre de progression en haut de l'écran : retour visuel immédiat au clic sur un lien,
 * le temps que la page suivante soit prête. Aucune dépendance externe.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  // Début : clic sur un lien interne (phase de capture, avant le routeur Next.js)
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) setPhase("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Fin : la nouvelle route est affichée
  useEffect(() => {
    if (phaseRef.current !== "loading") return;
    setPhase("done");
    const timer = window.setTimeout(() => setPhase("idle"), 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Filet de sécurité : ne jamais laisser la barre bloquée
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setTimeout(() => setPhase("idle"), 15_000);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
      data-phase={phase}
    >
      <div
        className="h-full bg-linear-to-r from-gold to-gold-pale shadow-[0_0_10px_rgb(212_168_67/0.7)]"
        style={{
          width: phase === "idle" ? "0%" : phase === "loading" ? "85%" : "100%",
          // "done" : la barre atteint 100 % puis s'estompe (transition retardée ci-dessous)
          opacity: phase === "loading" ? 1 : 0,
          transition:
            phase === "loading"
              ? "width 8s cubic-bezier(0.1, 0.8, 0.2, 1), opacity 0.1s"
              : phase === "done"
                ? "width 0.2s ease-out, opacity 0.3s ease 0.15s"
                : "none",
        }}
      />
    </div>
  );
}
