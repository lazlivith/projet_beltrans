/** Format CDC : BLT-YYYY-XXXXXX (séquence annuelle sur 6 chiffres). */
export function formatQuoteReference(year: number, sequence: number) {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999_999) {
    throw new RangeError(`Séquence de devis hors limites : ${sequence}`);
  }
  return `BLT-${year}-${String(sequence).padStart(6, "0")}`;
}

export const QUOTE_REFERENCE_PATTERN = /^BLT-\d{4}-\d{6}$/;
