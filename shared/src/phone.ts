import { parsePhoneNumberFromString } from "libphonenumber-js";

/** Numéro E.164 stocké → affichage lisible : « +242060000014 » → « +242 06 000 0014 ». */
export function formatPhone(e164: string) {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
