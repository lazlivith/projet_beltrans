"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  orientation = "horizontal",
  onNavigate,
}: {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul
      className={cn("flex", orientation === "horizontal" ? "items-center gap-1" : "flex-col gap-1")}
    >
      {mainNav.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative block rounded-md font-medium transition-colors",
                orientation === "horizontal"
                  ? "px-3.5 py-2 text-sm tracking-wide text-ink/75 hover:bg-surface hover:text-brand"
                  : "px-3 py-3 text-lg text-ink/80 hover:bg-surface hover:text-brand",
                active && "text-brand",
                active &&
                  orientation === "horizontal" &&
                  "after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-5 after:-translate-x-1/2 after:rounded-full after:bg-gold",
                active && orientation === "vertical" && "bg-brand/5 text-brand",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
