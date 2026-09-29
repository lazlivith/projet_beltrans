import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        gold: "bg-linear-to-br from-gold to-gold-pale text-ink shadow-[0_4px_20px_rgb(212_168_67/0.35)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgb(212_168_67/0.45)]",
        brand: "bg-brand text-white hover:bg-brand-hover",
        outline: "border border-line bg-white text-ink hover:border-brand hover:text-brand",
        "outline-light":
          "border border-white/25 text-white hover:border-white/60 hover:bg-white/10",
        ghost: "text-ink hover:bg-surface",
        whatsapp: "bg-whatsapp text-white hover:brightness-110",
        link: "h-auto p-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        default: "h-10 px-4 text-sm sm:h-11 sm:px-5",
        lg: "h-11 px-5 text-sm sm:h-12 sm:px-7 sm:text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "brand", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
