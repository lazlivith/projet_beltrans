import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { blurProps } from "@/lib/images";

type Crumb = { name: string; href: string };

/** En-tête des pages intérieures : fil d'Ariane (+ JSON-LD BreadcrumbList), H1, chapeau. */
export function PageHero({
  title,
  description,
  crumbs,
  image,
  children,
}: {
  title: string;
  description?: string;
  crumbs: Crumb[];
  /** Photo de fond optionnelle (assombrie pour garantir le contraste du texte). */
  image?: string;
  children?: React.ReactNode;
}) {
  const trail = [{ name: "Accueil", href: "/" }, ...crumbs];

  return (
    <section className="on-dark relative overflow-hidden text-white bg-hero">
      <JsonLd data={breadcrumbJsonLd(trail)} />
      {image && (
        <>
          <Image
            src={image}
            {...blurProps(image)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-linear-to-r from-ink/95 via-ink/85 to-ink/60"
            aria-hidden="true"
          />
        </>
      )}
      <div className="absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="relative container-page py-8 sm:py-14 lg:py-20">
        <nav aria-label="Fil d'Ariane" className="mb-3 sm:mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-[0.65rem] font-medium tracking-wider text-white/60 uppercase sm:text-xs">
            {trail.map((crumb, i) => {
              const last = i === trail.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-1.5">
                  {last ? (
                    <span aria-current="page" className="text-gold-pale">
                      {crumb.name}
                    </span>
                  ) : (
                    <>
                      <Link href={crumb.href} className="hover:text-white">
                        {crumb.name}
                      </Link>
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <h1 className="max-w-3xl font-serif text-[1.65rem] leading-tight sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-lg">
            {description}
          </p>
        )}
        {children && <div className="mt-5 sm:mt-8">{children}</div>}
      </div>
    </section>
  );
}
