"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, LazyMotion, m, MotionConfig } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  Lock,
  MessageCircle,
  Zap,
} from "lucide-react";
import type { QuoteResult } from "@/components/quote/quote-success-dialog";
import { useQuoteDraft } from "@/components/quote/quote-draft-store";
import {
  TURNSTILE_SITE_KEY,
  TurnstileWidget,
  type TurnstileHandle,
} from "@/components/quote/turnstile-widget";
import { ServiceIcon } from "@/components/sections/service-icon";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { services } from "@/content/services";
import {
  CARGO_NATURES,
  COUNTRY_SUGGESTIONS,
  HOME_CITY,
  HOME_COUNTRY,
  homeHub,
  isServiceType,
  OPERATION_LABELS,
  OPERATION_TYPES,
  QUOTE_STEP_FIELDS,
  quoteFormSchema,
  SERVICE_LABELS,
  type QuoteFormInput,
  type QuoteFormOutput,
} from "@beltrans/shared";
import { trackEvent } from "@/lib/analytics";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

const loadSuccessDialog = () => import("@/components/quote/quote-success-dialog");
/** Fenêtre de succès : hors bundle initial, préchargée à la dernière étape du formulaire. */
const QuoteSuccessDialog = dynamic(
  () => loadSuccessDialog().then((mod) => mod.QuoteSuccessDialog),
  {
    ssr: false,
  },
);
const loadMotionFeatures = () => import("./motion-features").then((mod) => mod.default);

const STEPS = [
  { title: "Service", description: "Quel type de prestation recherchez-vous ?" },
  { title: "Itinéraire", description: "D'où part votre marchandise et où doit-elle arriver ?" },
  { title: "Marchandise", description: "Quelques précisions pour un chiffrage juste." },
  { title: "Coordonnées", description: "Comment vous recontacter ?" },
] as const;

const LAST_STEP = STEPS.length - 1;

const OPERATION_HINTS: Record<(typeof OPERATION_TYPES)[number], string> = {
  IMPORT: "Marchandise qui arrive à Pointe-Noire",
  EXPORT: "Marchandise qui part de Pointe-Noire",
};

const DEFAULT_VALUES: Partial<QuoteFormInput> = {
  isUrgent: false,
  originCountry: "",
  originCity: "",
  destCountry: "",
  destCity: "",
  targetDate: "",
  cargoNature: "",
  cargoDescription: "",
  weightKg: "",
  volumeCbm: "",
  packageCount: "",
  containerNumber: "",
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phone: "",
  whatsapp: "",
  additionalNotes: "",
  consent: false,
};

function stepOfField(field: string) {
  const index = QUOTE_STEP_FIELDS.findIndex((fields) =>
    (fields as readonly string[]).includes(field),
  );
  return index === -1 ? LAST_STEP : index;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function QuoteWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>();
  const turnstileRef = useRef<TurnstileHandle>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const hydrated = useRef(false);
  const stepRef = useRef(step);
  stepRef.current = step;

  const form = useForm<QuoteFormInput, unknown, QuoteFormOutput>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });
  const {
    register,
    trigger,
    watch,
    reset,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  const values = watch();
  const isMaritime = values.serviceType === "MARITIME";
  const isImport = values.operationType !== "EXPORT";
  /** Côté étranger à renseigner : provenance (import) ou destination (export). */
  const foreignSide = isImport ? "origin" : "dest";
  const operationType = values.operationType;

  // Le côté congolais est toujours Pointe-Noire : pré-rempli selon import / export.
  useEffect(() => {
    if (!operationType) return;
    const home = operationType === "IMPORT" ? "dest" : "origin";
    const other = home === "dest" ? "origin" : "dest";
    setValue(`${home}Country`, HOME_COUNTRY);
    setValue(`${home}City`, HOME_CITY);
    if (getValues(`${other}Country`) === HOME_COUNTRY) {
      setValue(`${other}Country`, "");
      setValue(`${other}City`, "");
    }
  }, [operationType, setValue, getValues]);

  // Restauration du brouillon + présélection du service via ?service=MARITIME
  useEffect(() => {
    void Promise.resolve(useQuoteDraft.persist.rehydrate()).then(() => {
      const draft = useQuoteDraft.getState();
      const preselected = searchParams.get("service");
      reset({
        ...DEFAULT_VALUES,
        ...draft.values,
        ...(isServiceType(preselected) && { serviceType: preselected }),
        consent: false,
      });
      if (draft.step > 0 && draft.step <= LAST_STEP) setStep(draft.step);
      hydrated.current = true;
    });
  }, [reset, searchParams]);

  // Sauvegarde continue du brouillon
  useEffect(() => {
    const sub = watch((current) => {
      if (!hydrated.current) return;
      const { consent: _consent, ...draftValues } = current;
      useQuoteDraft.getState().save(stepRef.current, draftValues as Partial<QuoteFormInput>);
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const goTo = useCallback(
    (target: number) => {
      setStep(target);
      setServerError(null);
      if (hydrated.current) useQuoteDraft.getState().save(target, getValues());
      requestAnimationFrame(() => {
        headingRef.current?.focus({ preventScroll: true });
        headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [getValues],
  );

  // Précharge la fenêtre de succès dès l'étape « Coordonnées » : affichage instantané après envoi
  useEffect(() => {
    if (step === LAST_STEP) void loadSuccessDialog();
  }, [step]);

  async function next() {
    const valid = await trigger([...(QUOTE_STEP_FIELDS[step] ?? [])], { shouldFocus: true });
    if (valid) goTo(step + 1);
  }

  function onInvalid(fieldErrors: FieldErrors<QuoteFormInput>) {
    const first = Object.keys(fieldErrors)[0];
    if (first) goTo(stepOfField(first));
  }

  async function submit() {
    setServerError(null);
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setServerError("Merci de valider la vérification anti-spam ci-dessus.");
      return;
    }

    try {
      const raw = getValues(); // valeurs brutes : le serveur applique le même schéma Zod
      const res = await fetch(apiUrl("/api/v1/quotes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, turnstileToken, website: honeypotRef.current?.value ?? "" }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reference?: string;
        whatsappUrl?: string;
        error?: string;
        fieldErrors?: Record<string, string[] | undefined>;
      };

      if (!res.ok || !data.reference || !data.whatsappUrl) {
        turnstileRef.current?.reset();
        if (data.fieldErrors) {
          const entries = Object.entries(data.fieldErrors);
          for (const [field, messages] of entries) {
            if (messages?.[0]) setError(field as keyof QuoteFormInput, { message: messages[0] });
          }
          if (entries[0]) goTo(stepOfField(entries[0][0]));
        }
        setServerError(
          data.error ?? "L'envoi a échoué. Merci de réessayer ou de nous contacter sur WhatsApp.",
        );
        return;
      }

      trackEvent("quote_form_submitted", {
        reference: data.reference,
        service_type: raw.serviceType,
        operation_type: raw.operationType,
        is_urgent: raw.isUrgent,
      });
      setResult({ reference: data.reference, whatsappUrl: data.whatsappUrl, email: raw.email });
      useQuoteDraft.getState().clear();
    } catch {
      turnstileRef.current?.reset();
      setServerError("Connexion impossible. Vérifiez votre réseau ou contactez-nous sur WhatsApp.");
    }
  }

  function startOver() {
    setResult(null);
    reset(DEFAULT_VALUES);
    setStep(0);
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (step < LAST_STEP) {
      e.preventDefault();
      void next();
      return;
    }
    void form.handleSubmit(submit, onInvalid)(e);
  };

  const err = (name: keyof QuoteFormInput) => errors[name]?.message as string | undefined;
  const currentStep = STEPS[step]!;

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:p-8">
            {/* ── Stepper ── */}
            <nav aria-label="Étapes de la demande" className="mb-5 sm:mb-8">
              <ol className="grid grid-cols-4 gap-2">
                {STEPS.map((s, i) => {
                  const done = i < step;
                  const current = i === step;
                  return (
                    <li key={s.title}>
                      <button
                        type="button"
                        disabled={!done}
                        onClick={() => goTo(i)}
                        aria-current={current ? "step" : undefined}
                        className="group flex w-full flex-col gap-2 text-left disabled:cursor-default"
                      >
                        <span
                          className={cn(
                            "h-1.5 rounded-full transition-colors",
                            done || current ? "bg-brand" : "bg-line",
                          )}
                          aria-hidden="true"
                        />
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold sm:text-sm",
                            current
                              ? "text-brand"
                              : done
                                ? "text-ink group-hover:text-brand"
                                : "text-muted",
                          )}
                        >
                          {done ? (
                            <Check className="size-3.5" aria-hidden="true" />
                          ) : (
                            <span aria-hidden="true">{i + 1}.</span>
                          )}
                          <span className={cn(!current && "max-sm:sr-only")}>{s.title}</span>
                          {done && <span className="sr-only"> (terminée, modifier)</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <form onSubmit={handleFormSubmit} noValidate aria-labelledby="quote-step-title">
              <div className="mb-4 scroll-mt-24 sm:mb-6 sm:scroll-mt-28">
                <p className="text-sm font-medium text-muted">
                  Étape {step + 1} sur {STEPS.length}
                </p>
                <h2
                  id="quote-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="font-serif text-xl text-ink outline-none sm:text-2xl lg:text-3xl"
                >
                  {currentStep.title}
                </h2>
                <p className="mt-1 text-muted">{currentStep.description}</p>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-5 sm:space-y-6"
                >
                  {step === 0 && (
                    <>
                      <fieldset
                        aria-describedby={err("serviceType") ? "serviceType-error" : undefined}
                      >
                        <legend className="mb-3 text-sm font-medium">
                          Type de service{" "}
                          <span className="text-danger" aria-hidden="true">
                            *
                          </span>
                        </legend>
                        <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                          {services.map((s) => (
                            <label
                              key={s.type}
                              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3 transition-colors hover:border-brand/50 has-checked:border-brand has-checked:bg-brand/5 has-focus-visible:outline-2 has-focus-visible:outline-brand sm:flex-col sm:items-start sm:p-4 lg:flex-row lg:items-center"
                            >
                              <input
                                type="radio"
                                value={s.type}
                                {...register("serviceType")}
                                className="sr-only"
                              />
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/8 text-brand sm:size-10">
                                <ServiceIcon name={s.icon} className="size-5" />
                              </span>
                              <span className="font-semibold">{s.title}</span>
                            </label>
                          ))}
                        </div>
                        {err("serviceType") && (
                          <p
                            id="serviceType-error"
                            className="mt-2 text-sm font-medium text-danger"
                          >
                            {err("serviceType")}
                          </p>
                        )}
                      </fieldset>

                      <fieldset
                        aria-describedby={err("operationType") ? "operationType-error" : undefined}
                      >
                        <legend className="mb-3 text-sm font-medium">
                          Type d&apos;opération{" "}
                          <span className="text-danger" aria-hidden="true">
                            *
                          </span>
                        </legend>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {OPERATION_TYPES.map((op) => (
                            <label
                              key={op}
                              className="cursor-pointer rounded-xl border border-line p-3 transition-colors hover:border-brand/50 has-checked:border-brand has-checked:bg-brand/5 has-focus-visible:outline-2 has-focus-visible:outline-brand sm:p-4"
                            >
                              <input
                                type="radio"
                                value={op}
                                {...register("operationType")}
                                className="sr-only"
                              />
                              <span className="block font-semibold">{OPERATION_LABELS[op]}</span>
                              <span className="mt-0.5 block text-sm text-muted">
                                {OPERATION_HINTS[op]}
                              </span>
                            </label>
                          ))}
                        </div>
                        {err("operationType") && (
                          <p
                            id="operationType-error"
                            className="mt-2 text-sm font-medium text-danger"
                          >
                            {err("operationType")}
                          </p>
                        )}
                      </fieldset>

                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 has-checked:border-gold has-checked:bg-gold-pale/15 sm:p-4">
                        <input
                          type="checkbox"
                          {...register("isUrgent")}
                          className="mt-1 size-4 accent-brand"
                        />
                        <span>
                          <span className="flex items-center gap-1.5 font-semibold">
                            <Zap className="size-4 text-gold-deep" aria-hidden="true" /> Demande
                            urgente
                          </span>
                          <span className="text-sm text-muted">
                            Votre dossier sera traité en priorité.
                          </span>
                        </span>
                      </label>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <datalist id="country-suggestions">
                        {COUNTRY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                      <p className="mb-5 flex items-start gap-2.5 rounded-xl bg-brand/5 p-3 text-sm text-ink sm:p-4">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
                        <span>
                          {isImport ? "Arrivée" : "Départ"} :{" "}
                          <strong>{homeHub(values.serviceType)}</strong>, {HOME_COUNTRY}. BELTRANS
                          intervient une fois la marchandise au Congo.
                        </span>
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                        <Field
                          key={`${foreignSide}Country`}
                          id={`${foreignSide}Country`}
                          label={isImport ? "Pays de provenance" : "Pays de destination"}
                          required
                          error={err(`${foreignSide}Country`)}
                        >
                          {(a) => (
                            <Input
                              {...a}
                              list="country-suggestions"
                              autoComplete="off"
                              placeholder={isImport ? "ex. Chine" : "ex. France"}
                              {...register(`${foreignSide}Country`)}
                            />
                          )}
                        </Field>
                        <Field
                          key={`${foreignSide}City`}
                          id={`${foreignSide}City`}
                          label={
                            isImport
                              ? `Ville ou ${values.serviceType === "AERIEN" ? "aéroport" : "port"} de provenance`
                              : `Ville ou ${values.serviceType === "AERIEN" ? "aéroport" : "port"} de destination`
                          }
                          required
                          error={err(`${foreignSide}City`)}
                        >
                          {(a) => (
                            <Input
                              {...a}
                              placeholder={isImport ? "ex. Shanghai" : "ex. Le Havre"}
                              {...register(`${foreignSide}City`)}
                            />
                          )}
                        </Field>
                        <Field
                          id="targetDate"
                          label={isImport ? "Arrivée prévue à Pointe-Noire" : "Départ souhaité"}
                          error={err("targetDate")}
                          hint="Date approximative."
                        >
                          {(a) => (
                            <Input
                              {...a}
                              type="date"
                              min={todayIso()}
                              {...register("targetDate")}
                            />
                          )}
                        </Field>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      <Field
                        id="cargoNature"
                        label="Nature de la marchandise"
                        required
                        error={err("cargoNature")}
                        className="sm:col-span-2"
                      >
                        {(a) => (
                          <Select {...a} {...register("cargoNature")}>
                            <option value="">Sélectionnez…</option>
                            {CARGO_NATURES.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                      <Field
                        id="cargoDescription"
                        label="Description"
                        error={err("cargoDescription")}
                        className="sm:col-span-2"
                      >
                        {(a) => (
                          <Textarea
                            {...a}
                            placeholder="Type de produits, conditionnement, contraintes particulières…"
                            {...register("cargoDescription")}
                          />
                        )}
                      </Field>
                      <Field id="weightKg" label="Poids total (kg)" error={err("weightKg")}>
                        {(a) => (
                          <Input
                            {...a}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            {...register("weightKg")}
                          />
                        )}
                      </Field>
                      <Field id="volumeCbm" label="Volume (m³)" error={err("volumeCbm")}>
                        {(a) => (
                          <Input
                            {...a}
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="any"
                            {...register("volumeCbm")}
                          />
                        )}
                      </Field>
                      <Field id="packageCount" label="Nombre de colis" error={err("packageCount")}>
                        {(a) => (
                          <Input
                            {...a}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            {...register("packageCount")}
                          />
                        )}
                      </Field>
                      {isMaritime && (
                        <Field
                          id="containerNumber"
                          label="N° de conteneur"
                          error={err("containerNumber")}
                          hint="Si déjà connu — format ISO 6346, ex. MSCU1234567."
                        >
                          {(a) => (
                            <Input
                              {...a}
                              autoCapitalize="characters"
                              maxLength={13}
                              {...register("containerNumber")}
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                      <Field id="firstName" label="Prénom" required error={err("firstName")}>
                        {(a) => (
                          <Input {...a} autoComplete="given-name" {...register("firstName")} />
                        )}
                      </Field>
                      <Field id="lastName" label="Nom" required error={err("lastName")}>
                        {(a) => (
                          <Input {...a} autoComplete="family-name" {...register("lastName")} />
                        )}
                      </Field>
                      <Field
                        id="companyName"
                        label="Société"
                        error={err("companyName")}
                        className="sm:col-span-2"
                      >
                        {(a) => (
                          <Input {...a} autoComplete="organization" {...register("companyName")} />
                        )}
                      </Field>
                      <Field
                        id="email"
                        label="E-mail"
                        required
                        error={err("email")}
                        className="sm:col-span-2"
                      >
                        {(a) => (
                          <Input
                            {...a}
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            {...register("email")}
                          />
                        )}
                      </Field>
                      <Field
                        id="phone"
                        label="Téléphone"
                        required
                        error={err("phone")}
                        hint="Avec indicatif si hors Congo (ex. +33…)."
                      >
                        {(a) => (
                          <Input
                            {...a}
                            type="tel"
                            autoComplete="tel"
                            placeholder="+242 06 000 00 00"
                            {...register("phone")}
                          />
                        )}
                      </Field>
                      <Field
                        id="whatsapp"
                        label="WhatsApp"
                        error={err("whatsapp")}
                        hint="Si différent du téléphone."
                      >
                        {(a) => (
                          <Input
                            {...a}
                            type="tel"
                            placeholder="+242 06 000 00 00"
                            {...register("whatsapp")}
                          />
                        )}
                      </Field>
                      <Field
                        id="additionalNotes"
                        label="Informations complémentaires"
                        error={err("additionalNotes")}
                        className="sm:col-span-2"
                      >
                        {(a) => <Textarea {...a} {...register("additionalNotes")} />}
                      </Field>

                      {/* Honeypot anti-bot : invisible pour les humains et les lecteurs d'écran */}
                      <div className="absolute -left-[9999px]" aria-hidden="true">
                        <label htmlFor="website">Site web</label>
                        <input
                          id="website"
                          ref={honeypotRef}
                          tabIndex={-1}
                          autoComplete="off"
                          defaultValue=""
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            {...register("consent")}
                            aria-invalid={Boolean(err("consent"))}
                            aria-describedby={err("consent") ? "consent-error" : undefined}
                            className="mt-1 size-4 shrink-0 accent-brand"
                          />
                          <span className="text-sm leading-relaxed text-muted">
                            J&apos;accepte que BELTRANS utilise ces informations pour traiter ma
                            demande de devis et me recontacter.{" "}
                            <Link
                              href="/mentions-legales"
                              target="_blank"
                              className="font-medium text-brand underline"
                            >
                              Politique de confidentialité
                            </Link>
                            <span className="text-danger" aria-hidden="true">
                              {" "}
                              *
                            </span>
                          </span>
                        </label>
                        {err("consent") && (
                          <p id="consent-error" className="mt-2 text-sm font-medium text-danger">
                            {err("consent")}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} />
                      </div>
                    </div>
                  )}
                </m.div>
              </AnimatePresence>

              {serverError && (
                <div
                  role="alert"
                  className="mt-6 flex gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
                >
                  <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{serverError}</p>
                    <a
                      href={whatsappLink("Bonjour BELTRANS, je souhaite une demande de devis.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-semibold underline"
                    >
                      Écrire sur WhatsApp
                    </a>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:mt-8 sm:flex-row sm:justify-between sm:gap-3 sm:pt-6">
                {step > 0 ? (
                  <Button type="button" variant="ghost" onClick={() => goTo(step - 1)}>
                    <ArrowLeft aria-hidden="true" /> Précédent
                  </Button>
                ) : (
                  <span />
                )}
                {step < LAST_STEP ? (
                  <Button type="submit" size="lg">
                    Continuer <ArrowRight aria-hidden="true" />
                  </Button>
                ) : (
                  <Button type="submit" variant="gold" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden="true" /> Envoi en cours…
                      </>
                    ) : (
                      <>
                        Envoyer ma demande <ArrowRight aria-hidden="true" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* ── Récapitulatif & réassurance ── */}
          <aside className="space-y-3 sm:space-y-5 lg:sticky lg:top-28 lg:self-start">
            {/* Récapitulatif utile à côté du formulaire uniquement (desktop) */}
            <div className="hidden rounded-3xl bg-surface p-6 lg:block">
              <h2 className="mb-4 font-bold">Votre demande</h2>
              <dl className="space-y-3 text-sm">
                <SummaryRow
                  label="Service"
                  value={values.serviceType && SERVICE_LABELS[values.serviceType]}
                />
                <SummaryRow
                  label="Opération"
                  value={values.operationType && OPERATION_LABELS[values.operationType]}
                />
                <SummaryRow
                  label="Trajet"
                  value={
                    values.originCity || values.destCity
                      ? `${values.originCity || "…"} → ${values.destCity || "…"}`
                      : undefined
                  }
                />
                <SummaryRow label="Marchandise" value={values.cargoNature || undefined} />
                {values.isUrgent && (
                  <p className="inline-flex items-center gap-1 rounded-full bg-gold-pale/40 px-2.5 py-1 text-xs font-semibold text-gold-deep">
                    <Zap className="size-3" aria-hidden="true" /> Urgent
                  </p>
                )}
              </dl>
            </div>
            <ul className="space-y-2 rounded-2xl border border-line p-4 text-sm text-muted sm:space-y-3 sm:rounded-3xl sm:p-6">
              <li className="flex gap-2.5">
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" /> Gratuit et
                sans engagement
              </li>
              <li className="flex gap-2.5">
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" /> Référence de
                suivi immédiate
              </li>
              <li className="flex gap-2.5">
                <Lock className="size-4 shrink-0 text-success" aria-hidden="true" /> Données
                confidentielles
              </li>
            </ul>
            <a
              href={whatsappLink("Bonjour BELTRANS, je souhaite une demande de devis.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-line p-4 text-sm transition-colors hover:border-whatsapp sm:rounded-3xl sm:p-5"
            >
              <MessageCircle className="size-6 shrink-0 text-whatsapp" aria-hidden="true" />
              <span>
                <span className="block font-semibold">Vous préférez échanger ?</span>
                <span className="text-muted">Écrivez-nous sur WhatsApp</span>
              </span>
            </a>
          </aside>
        </div>

        <p className="sr-only" aria-live="polite">
          Étape {step + 1} sur {STEPS.length} : {currentStep.title}
        </p>

        {result && <QuoteSuccessDialog result={result} onClose={startOver} />}
      </MotionConfig>
    </LazyMotion>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-right font-medium", !value && "text-muted/60")}>{value ?? "—"}</dd>
    </div>
  );
}
