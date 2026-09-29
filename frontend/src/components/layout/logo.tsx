import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo officiel BELTRANS (PNG transparent, conçu pour un fond clair). */
export function Logo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/images/logo.png"
      alt="BELTRANS sarl"
      width={790}
      height={283}
      priority={priority}
      sizes="160px"
      className={cn("h-12 w-auto", className)}
    />
  );
}
