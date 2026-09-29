import placeholders from "./image-placeholders.json";

const blurMap: Record<string, string> = placeholders;

/**
 * Props next/image pour un aperçu flou pendant le chargement (généré par `npm run images`).
 * Sans aperçu connu pour cette image, retourne un objet vide (pas de placeholder).
 */
export function blurProps(src: string) {
  const blurDataURL = blurMap[src];
  return blurDataURL ? { placeholder: "blur" as const, blurDataURL } : {};
}
