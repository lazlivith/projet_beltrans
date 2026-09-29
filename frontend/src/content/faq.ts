export type FaqItem = { question: string; answer: string };

// TODO(validation): réponses à valider par BELTRANS (délais, périmètre, documents).
export const faq: FaqItem[] = [
  {
    question: "Comment obtenir un devis ?",
    answer:
      "Remplissez notre formulaire de demande de devis en ligne (environ 2 minutes). Vous recevez immédiatement une référence BLT-… par e-mail, puis un conseiller vous recontacte avec une proposition chiffrée.",
  },
  {
    question: "Sous quel délai recevrai-je une réponse ?",
    answer:
      "Nous traitons les demandes dans les meilleurs délais. Pour une urgence, indiquez-le dans le formulaire ou contactez-nous directement sur WhatsApp en rappelant votre référence.",
  },
  {
    question: "Êtes-vous agréés pour le dédouanement ?",
    answer:
      "Oui. BELTRANS est commissionnaire agréé CEMAC sous le numéro CDA 262 et immatriculée au RCCM sous le n° CG-PNR14B706.",
  },
  {
    question: "Quels documents sont nécessaires pour dédouaner une marchandise ?",
    answer:
      "Au minimum : facture commerciale, liste de colisage et titre de transport (connaissement maritime ou lettre de transport aérien). Selon la marchandise, des certificats (origine, phytosanitaire, conformité…) peuvent être exigés : nous vous indiquons la liste précise lors du devis.",
  },
  {
    question: "Quelle différence entre FCL et LCL ?",
    answer:
      "FCL (Full Container Load) : vous réservez un conteneur entier. LCL (Less than Container Load) : vos marchandises sont groupées avec celles d'autres clients, idéal pour les petits volumes.",
  },
  {
    question: "Où intervenez-vous ?",
    answer:
      "Uniquement à Pointe-Noire, au port et à l'aéroport. BELTRANS prend en charge votre marchandise une fois qu'elle est au Congo : à son arrivée (import) ou avant son départ (export).",
  },
  {
    question: "Organisez-vous le transport depuis l'étranger ?",
    answer:
      "Non. Le transport international (navire ou avion) est organisé par vous, votre fournisseur ou votre transitaire au départ. BELTRANS intervient dès l'arrivée de la marchandise à Pointe-Noire : réception, dédouanement et sortie du port.",
  },
  {
    question: "Prenez-vous en charge les marchandises dangereuses ou périssables ?",
    answer:
      "Oui, sous réserve d'étude préalable et du respect des réglementations IMDG (maritime) et IATA (aérien) lors de leur passage au port ou à l'aéroport de Pointe-Noire. Précisez la nature de la marchandise dans votre demande de devis.",
  },
  {
    question: "Comment suivre mon expédition ?",
    answer:
      "Votre conseiller vous tient informé à chaque étape clé. Un espace client avec suivi en ligne est prévu dans une prochaine version du site.",
  },
];
