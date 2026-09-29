import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  FileCheck2,
  Headset,
  MapPin,
  MessageCircle,
  PackageCheck,
  Ship,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { CtaBand } from "@/components/sections/cta-band";
import { ServiceIcon } from "@/components/sections/service-icon";
import { ServicesGrid } from "@/components/sections/services-grid";
import { Button } from "@/components/ui/button";
import { services } from "@/content/services";
import { siteConfig } from "@/lib/site";
import { whatsappLink } from "@/lib/whatsapp";
import { blurProps } from "@/lib/images";

const trustItems = [
  { icon: PackageCheck, label: "Opérations", value: "Import & export" },
  { icon: BadgeCheck, label: "Agrément", value: `CEMAC N° ${siteConfig.cemacAgreement}` },
  { icon: Clock, label: "Disponibilité", value: siteConfig.hours },
  { icon: MapPin, label: "Périmètre", value: "Port de Pointe-Noire" },
];

const steps = [
  {
    title: "Votre demande",
    text: "Décrivez votre marchandise en ligne en 2 minutes et recevez votre référence BLT.",
  },
  {
    title: "Notre proposition",
    text: "Un conseiller étudie votre dossier et vous adresse une offre chiffrée.",
  },
  {
    title: "Prise en charge à Pointe-Noire",
    text: "Dès l'arrivée au port ou à l'aéroport (ou avant le départ) : documents et dédouanement.",
  },
  {
    title: "Sortie ou embarquement",
    text: "Mainlevée et sortie du port à l'import, mise à bord à l'export, avec un point à chaque étape.",
  },
];

const reasons = [
  {
    icon: ShieldCheck,
    title: "Agréé & conforme",
    text: `Commissionnaire agréé CEMAC (N° ${siteConfig.cemacAgreement}), immatriculé RCCM ${siteConfig.rccm}.`,
  },
  {
    icon: Headset,
    title: "Interlocuteur unique",
    text: "Un conseiller dédié suit votre dossier de la demande à la sortie du port.",
  },
  {
    icon: Timer,
    title: "Réactivité 7j/7",
    text: "Une équipe joignable à toute heure, y compris sur WhatsApp.",
  },
  {
    icon: FileCheck2,
    title: "Maîtrise douanière",
    text: "Anticipation des documents et des régimes pour éviter blocages et surcoûts.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="on-dark relative overflow-hidden text-white bg-hero">
        <Image
          src="/images/hero-port.jpg"
          {...blurProps("/images/hero-port.jpg")}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-linear-to-br from-ink/95 via-ink/80 to-brand/60"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-[22%] h-px overflow-hidden"
          aria-hidden="true"
        >
          <div className="h-full w-[200%] animate-route bg-[repeating-linear-gradient(90deg,rgb(212_168_67/0.55)_0_12px,transparent_12px_28px)]" />
        </div>

        <div className="relative container-page grid gap-8 py-10 sm:py-16 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-12 lg:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.14em] text-gold-pale uppercase sm:mb-6 sm:px-3.5 sm:py-1.5 sm:text-xs sm:tracking-[0.18em]">
              <span
                className="size-1.5 animate-pulse-dot rounded-full bg-gold"
                aria-hidden="true"
              />
              {siteConfig.legalName}
            </p>
            <h1 className="font-serif text-[1.75rem] leading-[1.12] sm:text-5xl lg:text-6xl">
              Transit & dédouanement{" "}
              <span className="text-gradient-gold italic">au port de Pointe-Noire</span>
            </h1>
            <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-white/80 sm:mt-6 sm:text-lg">
              Votre marchandise arrive au port ou à l&apos;aéroport de Pointe-Noire, ou doit en
              partir ? BELTRANS prend le relais dès qu&apos;elle est au Congo : réception,
              formalités et dédouanement, en conformité à chaque étape.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href="/devis">
                  Demander un devis gratuit <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline-light" size="lg">
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" /> {siteConfig.phoneDisplay}
                </a>
              </Button>
            </div>
          </div>

          {/* Accès rapide au devis par service : raccourcit le parcours de conversion */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-6 lg:p-7">
            <h2 className="text-base font-semibold sm:text-lg">Devis express</h2>
            <p className="mt-0.5 mb-3 text-sm text-white/70 sm:mt-1 sm:mb-5">
              Quel service vous intéresse ?
            </p>
            <ul className="grid gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-1">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/devis?service=${s.type}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-ink/40 px-3.5 py-2.5 text-sm transition-colors hover:border-gold/50 hover:bg-ink/70 sm:px-4 sm:py-3 sm:text-base"
                  >
                    <ServiceIcon name={s.icon} className="size-4.5 text-gold sm:size-5" />
                    <span className="flex-1 font-medium">{s.title}</span>
                    <ArrowRight
                      className="size-4 text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-gold"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bandeau de confiance ── */}
        <div className="relative border-t border-white/10 bg-ink/80">
          <dl className="container-page grid grid-cols-2 gap-x-3 gap-y-4 py-4 sm:py-6 lg:grid-cols-4">
            {trustItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold sm:size-10">
                  <Icon className="size-4 sm:size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.65rem] tracking-wider text-white/60 uppercase sm:text-xs">
                    {label}
                  </dt>
                  <dd className="text-[0.8rem] leading-snug font-semibold sm:text-base">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="bg-surface section-y" aria-labelledby="services-title">
        <div className="container-page">
          <div className="mb-6 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <p className="eyebrow">Nos services</p>
              <h2 id="services-title" className="heading-section">
                Ce que nous <em className="text-brand">proposons</em>
              </h2>
            </div>
            <p className="max-w-sm text-sm text-muted sm:text-base">
              Maritime, aérien et dédouanement : nous intervenons à Pointe-Noire, à l&apos;arrivée
              comme au départ de vos marchandises.
            </p>
          </div>
          <ServicesGrid />
        </div>
      </section>

      {/* ── PROCESSUS ── */}
      <section className="section-y cv-auto" aria-labelledby="process-title">
        <div className="container-page">
          <p className="eyebrow">Comment ça marche</p>
          <h2 id="process-title" className="mb-8 heading-section sm:mb-12">
            De la demande à la livraison
          </h2>
          <ol className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="relative flex gap-4 sm:block">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink font-serif text-lg text-gold sm:mb-4 sm:size-12 sm:text-xl"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="mb-1 text-base font-bold sm:mb-2 sm:text-lg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted sm:text-base">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── POURQUOI BELTRANS ── */}
      <section className="bg-surface section-y cv-auto" aria-labelledby="why-title">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div>
            <p className="eyebrow">Pourquoi BELTRANS</p>
            <h2 id="why-title" className="heading-section">
              Un partenaire local, agréé et réactif
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
              Basés à {siteConfig.address.locality}, nous accompagnons importateurs et exportateurs
              dont les marchandises passent par le port ou l&apos;aéroport de Pointe-Noire.
            </p>
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-white p-4 sm:mt-8 sm:p-5">
              <Ship className="mt-0.5 size-5 shrink-0 text-brand sm:size-6" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold sm:text-base">Notre périmètre</h3>
                <p className="mt-1 text-sm text-muted sm:text-base">
                  {siteConfig.scope}, une fois la marchandise au Congo : import à l&apos;arrivée,
                  export au départ. Le transport international reste organisé par vous ou votre
                  fournisseur.
                </p>
              </div>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-5">
            {reasons.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-2xl border border-line bg-white p-4 sm:p-6">
                <Icon className="mb-3 size-6 text-brand sm:mb-4 sm:size-7" aria-hidden="true" />
                <h3 className="mb-1 text-sm font-bold sm:mb-2 sm:text-base">{title}</h3>
                <p className="text-xs leading-relaxed text-muted sm:text-sm">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
