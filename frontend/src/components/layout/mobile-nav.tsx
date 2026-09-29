"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const loadSheet = () => import("@/components/layout/mobile-nav-sheet");

/**
 * Le panneau (Radix Dialog + contenu) n'est pas dans le bundle initial : il est téléchargé
 * au premier survol / toucher du bouton, puis affiché à l'ouverture.
 */
const MobileNavSheet = dynamic(loadSheet, { ssr: false });

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="outline"
        size="icon"
        className="lg:hidden"
        aria-label="Ouvrir le menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={mounted ? "mobile-nav" : undefined}
        onPointerEnter={() => void loadSheet()}
        onTouchStart={() => void loadSheet()}
        onFocus={() => void loadSheet()}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
      >
        <Menu className="size-5!" aria-hidden="true" />
      </Button>
      {mounted && <MobileNavSheet open={open} onOpenChange={setOpen} returnFocusTo={buttonRef} />}
    </>
  );
}
