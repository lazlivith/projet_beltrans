/**
 * Optimise les visuels fournis par BELTRANS (assets/images-src → public/images).
 * Les originaux (jusqu'à 13 Mo) ne sont jamais servis : on publie des versions redimensionnées ;
 * next/image se charge ensuite de la conversion AVIF/WebP à la taille de l'écran.
 *
 * Usage : npm run images -w frontend   (à relancer après ajout/remplacement d'un visuel)
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = (f) => path.join(root, "assets/images-src", f);
const out = (f) => path.join(root, f);

/** Photos : largeur max, JPEG progressif mozjpeg (source haute qualité pour next/image). */
const photos = [
  ["arrière plan.avif", "public/images/hero-port.jpg", 2000],
  ["image nos ser.jpg", "public/images/services-banner.jpg", 2400],
  ["image maritime.jpg", "public/images/services/maritime.jpg", 1600],
  ["image avion 2.jpg", "public/images/services/aerien.jpg", 1600],
  ["image douane.jpg", "public/images/services/dedouanement.jpg", 1600],
];

const LOGO = src("logo/logo final.png");

async function run() {
  await mkdir(out("public/images/services"), { recursive: true });

  const placeholders = {};
  for (const [from, to, width] of photos) {
    const info = await sharp(src(from))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toFile(out(to));
    console.log(`✓ ${to} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} Ko)`);

    // Aperçu flou (~300 octets) affiché par next/image pendant le chargement (placeholder="blur")
    const tiny = await sharp(out(to)).resize(16).webp({ quality: 40 }).toBuffer();
    placeholders[to.replace(/^public/, "")] = `data:image/webp;base64,${tiny.toString("base64")}`;
  }
  await writeFile(
    out("src/lib/image-placeholders.json"),
    `${JSON.stringify(placeholders, null, 2)}\n`,
  );
  console.log("✓ src/lib/image-placeholders.json");

  // Logo : suppression des marges transparentes
  const logo = await sharp(LOGO)
    .trim()
    .png({ compressionLevel: 9, palette: true })
    .toFile(out("public/images/logo.png"));
  console.log(`✓ public/images/logo.png (${logo.width}×${logo.height})`);

  // Favicons : le globe (partie gauche du logo), recadré en carré
  const { width: w, height: h } = await sharp(LOGO)
    .trim()
    .toBuffer({ resolveWithObject: true })
    .then((r) => r.info);
  const globe = await sharp(LOGO)
    .trim()
    .extract({ left: 0, top: 0, width: Math.min(h, w), height: h })
    .toBuffer();

  await sharp(globe)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out("src/app/icon.png"));
  await sharp(globe)
    .resize(152, 152, { fit: "contain", background: "#ffffff" })
    .extend({ top: 14, bottom: 14, left: 14, right: 14, background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(out("src/app/apple-icon.png"));
  console.log("✓ src/app/icon.png, src/app/apple-icon.png");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
