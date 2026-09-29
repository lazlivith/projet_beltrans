import type { Metadata } from "next";
import { AdminProviders } from "@/components/admin/providers";

export const metadata: Metadata = {
  title: { default: "Espace admin", template: "%s | Admin BELTRANS" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProviders>{children}</AdminProviders>;
}
