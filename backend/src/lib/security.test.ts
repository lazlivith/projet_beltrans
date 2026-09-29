import { describe, expect, it } from "vitest";
import { hashPassword, passwordPolicyError, verifyPassword } from "./password";

describe("mots de passe (scrypt)", () => {
  it("vérifie le bon mot de passe et rejette les autres", async () => {
    const hash = await hashPassword("Beltrans2026!secure");
    expect(hash).toMatch(/^scrypt\$32768\$8\$1\$/);
    expect(await verifyPassword("Beltrans2026!secure", hash)).toBe(true);
    expect(await verifyPassword("beltrans2026!secure", hash)).toBe(false);
    expect(await verifyPassword("x", "format-invalide")).toBe(false);
  });

  it("produit un sel différent à chaque hachage", async () => {
    expect(await hashPassword("MotDePasse12345")).not.toBe(await hashPassword("MotDePasse12345"));
  });

  it("applique la politique de mot de passe", () => {
    expect(passwordPolicyError("court1")).toMatch(/12 caractères/);
    expect(passwordPolicyError("uniquementdeslettres")).toMatch(/chiffres/);
    expect(passwordPolicyError("Exemple-Valide-2026")).toBeNull();
  });
});
