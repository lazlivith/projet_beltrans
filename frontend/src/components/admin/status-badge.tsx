import { Archive, CheckCircle2, CircleDot, Clock3, XCircle, type LucideIcon } from "lucide-react";
import { STATUS_LABELS, type QuoteStatusValue } from "@beltrans/shared";
import { cn } from "@/lib/utils";

/** Statut = icône + libellé (jamais la couleur seule). */
const STYLES: Record<QuoteStatusValue, { icon: LucideIcon; className: string }> = {
  PENDING: { icon: CircleDot, className: "bg-gold-pale/40 text-gold-deep ring-gold/40" },
  UNDER_REVIEW: { icon: Clock3, className: "bg-brand/8 text-brand ring-brand/25" },
  QUOTED: { icon: CheckCircle2, className: "bg-success/10 text-success ring-success/30" },
  REJECTED: { icon: XCircle, className: "bg-danger/8 text-danger ring-danger/25" },
  ARCHIVED: { icon: Archive, className: "bg-surface text-muted ring-line" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: QuoteStatusValue;
  className?: string;
}) {
  const { icon: Icon, className: tone } = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
