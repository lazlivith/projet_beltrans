import type { QuoteRequest } from "@prisma/client";
import { formatQuoteReference, type QuoteApiOutput } from "@beltrans/shared";
import { prisma } from "../lib/prisma";

export type QuoteCreateData = Omit<QuoteApiOutput, "consent" | "turnstileToken" | "website">;

/**
 * Persiste la demande et génère sa référence de façon atomique (CDC §3.1 étape 3).
 * L'incrément du compteur et la création du devis partagent la même transaction.
 */
export async function createQuoteRequest(data: QuoteCreateData): Promise<QuoteRequest> {
  const year = new Date().getUTCFullYear();

  return prisma.$transaction(async (tx) => {
    const counter = await tx.quoteCounter.upsert({
      where: { year },
      create: { year, value: 1 },
      update: { value: { increment: 1 } },
    });

    return tx.quoteRequest.create({
      data: {
        ...data,
        reference: formatQuoteReference(year, counter.value),
        consentAt: new Date(),
      },
    });
  });
}
