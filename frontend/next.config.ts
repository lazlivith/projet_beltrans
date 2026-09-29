import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Paquet partagé livré en TypeScript (workspace npm)
  transpilePackages: ["@beltrans/shared"],
  images: {
    // AVIF ≈ 40 % plus léger que WebP ; WebP en repli pour les navigateurs plus anciens
    formats: ["image/avif", "image/webp"],
    // Défaut Next.js : 60 s. Les visuels changent rarement (et changent de contenu via
    // `npm run images`) : 30 jours évitent de ré-encoder les images à chaque visite.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  // Services retirés du périmètre (BELTRANS opère uniquement à Pointe-Noire)
  async redirects() {
    return [
      { source: "/services/transport-terrestre", destination: "/services", permanent: true },
      { source: "/services/transport-multimodal", destination: "/services", permanent: true },
      // Rubrique « Actualités » supprimée : les anciens liens renvoient vers l'accueil
      { source: "/actualites", destination: "/", permanent: true },
      { source: "/actualites/:slug*", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
