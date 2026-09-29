import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { Borders, Fill, Font, Workbook } from "exceljs";

/** Charte BELTRANS appliquée aux fichiers Excel (couleurs ARGB). */
export const COLORS = {
  ink: "FF04102B",
  brand: "FF0D3FA6",
  gold: "FFD4A843",
  goldPale: "FFFBF3DC",
  goldDeep: "FF7A5A12",
  surface: "FFF5F7FB",
  line: "FFE3E7F0",
  muted: "FF4A5572",
  white: "FFFFFFFF",
  input: "FFFFF8E1", // cellules à compléter
} as const;

export const FONT = "Calibri";

export const fill = (argb: string): Fill => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb },
});

export const font = (options: Partial<Font> = {}): Partial<Font> => ({
  name: FONT,
  size: 10,
  color: { argb: COLORS.ink },
  ...options,
});

const thin = (argb: string = COLORS.line) => ({ style: "thin" as const, color: { argb } });
export const border = (argb?: string): Partial<Borders> => ({
  top: thin(argb),
  left: thin(argb),
  bottom: thin(argb),
  right: thin(argb),
});
export const bottomBorder = (argb?: string): Partial<Borders> => ({ bottom: thin(argb) });

/** Montants en francs CFA, sans décimales. */
export const FCFA = '#,##0 "FCFA";-#,##0 "FCFA";""';
export const DATE = "dd/mm/yyyy";
export const DATETIME = "dd/mm/yyyy hh:mm";

/** Heure de Pointe-Noire (UTC+1) : Excel n'a pas de fuseau, on décale la valeur affichée. */
export function toLocalExcelDate(date: Date | null | undefined) {
  return date ? new Date(date.getTime() + 60 * 60 * 1000) : null;
}

let logoCache: Buffer | null | undefined;

/** Logo officiel (backend/assets/logo.png) ; absent → fichier généré sans image. */
export function addLogo(workbook: Workbook) {
  if (logoCache === undefined) {
    const file = path.resolve(process.cwd(), "assets/logo.png");
    logoCache = existsSync(file) ? readFileSync(file) : null;
  }
  return logoCache
    ? workbook.addImage({ buffer: logoCache as unknown as ArrayBuffer, extension: "png" })
    : null;
}
