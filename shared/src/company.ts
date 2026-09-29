/**
 * Données légales et de contact de BELTRANS — source unique pour le site, l'API et les e-mails.
 * ⚠️ Les éléments marqués TODO(validation) doivent être confirmés par BELTRANS (CDC Phase 1).
 */
export const company = {
  name: "BELTRANS",
  legalName: "Société Beli Transit Frets Services",
  legalForm: "SARL",
  rccm: "CG-PNR14B706",
  cemacAgreement: "CDA 262",
  phone: "+242066030653",
  phoneDisplay: "+242 06 603 06 53",
  whatsapp: "242066030653",
  email: "contact@beltrans.com",
  address: {
    // TODO(validation): adresse postale exacte du siège
    streetAddress: "",
    locality: "Pointe-Noire",
    country: "CG",
    countryName: "République du Congo",
  },
  hours: "7j/7 · 24h/24",
} as const;
