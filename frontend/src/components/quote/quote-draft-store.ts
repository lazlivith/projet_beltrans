import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { QuoteFormInput } from "@beltrans/shared";

type QuoteDraft = Partial<Omit<QuoteFormInput, "consent">>;

type QuoteDraftState = {
  step: number;
  values: QuoteDraft;
  save: (step: number, values: QuoteDraft) => void;
  clear: () => void;
};

/**
 * Brouillon du devis conservé en sessionStorage : un rechargement ou un retour arrière
 * ne fait pas perdre la saisie. Hydratation manuelle (skipHydration) pour éviter tout
 * décalage SSR / client.
 */
export const useQuoteDraft = create<QuoteDraftState>()(
  persist(
    (set) => ({
      step: 0,
      values: {},
      save: (step, values) => set({ step, values }),
      clear: () => set({ step: 0, values: {} }),
    }),
    {
      name: "beltrans-quote-draft",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ step, values }) => ({ step, values }),
      skipHydration: true,
    },
  ),
);
