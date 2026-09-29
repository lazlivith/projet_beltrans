import { FileCheck2, Plane, Ship, type LucideProps } from "lucide-react";
import type { ServiceIcon as ServiceIconName } from "@/content/services";

const icons = {
  ship: Ship,
  plane: Plane,
  "file-check": FileCheck2,
} satisfies Record<ServiceIconName, React.ComponentType<LucideProps>>;

export function ServiceIcon({ name, ...props }: { name: ServiceIconName } & LucideProps) {
  const Icon = icons[name];
  return <Icon aria-hidden="true" {...props} />;
}
