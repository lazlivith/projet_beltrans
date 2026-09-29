/**
 * Squelette affiché instantanément pendant le chargement d'une page (streaming React),
 * à la place d'un écran figé : même structure qu'une page intérieure (hero + cartes).
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Chargement de la page…</span>
      <div className="bg-hero">
        <div className="container-page space-y-4 py-8 sm:py-14 lg:py-20">
          <div className="h-3 w-32 animate-pulse rounded bg-white/15" />
          <div className="h-8 w-3/4 max-w-lg animate-pulse rounded-lg bg-white/20 sm:h-10" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-white/10" />
        </div>
      </div>
      <div className="container-page grid gap-4 py-10 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-line p-4 sm:p-5">
            <div className="aspect-[16/8] animate-pulse rounded-xl bg-surface" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface" />
            <div className="h-3 w-full animate-pulse rounded bg-surface" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-surface" />
          </div>
        ))}
      </div>
    </div>
  );
}
