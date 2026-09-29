import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ServiceIcon } from "@/components/sections/service-icon";
import { services } from "@/content/services";
import { blurProps } from "@/lib/images";

export function ServicesGrid({ headingLevel = "h3" }: { headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
      {services.map((service, i) => (
        <li key={service.slug}>
          <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white p-4 shadow-sm transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-1 before:origin-left before:scale-x-0 before:bg-linear-to-r before:from-brand before:to-sky before:transition-transform focus-within:shadow-xl hover:-translate-y-1 hover:shadow-xl hover:before:scale-x-100 sm:p-5 lg:p-6">
            {service.image && (
              <Image
                src={service.image}
                {...blurProps(service.image)}
                alt=""
                width={640}
                height={360}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="mb-4 aspect-[16/8] w-full rounded-xl object-cover sm:aspect-video lg:mb-5"
              />
            )}
            <div className="mb-3 flex items-center justify-between lg:mb-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-brand/8 text-brand lg:size-12 lg:rounded-xl">
                <ServiceIcon name={service.icon} className="size-4.5 lg:size-6" />
              </span>
              <span
                className="text-xs font-bold tracking-[0.2em] text-gold-deep"
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <Heading className="mb-1.5 text-base font-bold text-ink lg:mb-2 lg:text-lg">
              {service.title}
            </Heading>
            <p className="mb-4 flex-1 text-sm leading-relaxed text-muted lg:mb-5 lg:text-base">
              {service.short}
            </p>
            <Link
              href={`/services/${service.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand group-hover:gap-2.5 after:absolute after:inset-0"
            >
              En savoir plus<span className="sr-only"> sur le {service.title.toLowerCase()}</span>
              <ArrowRight className="size-4 transition-all" aria-hidden="true" />
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
}
