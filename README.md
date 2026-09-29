# BELTRANS — Plateforme web institutionnelle & commerciale

Refonte du site de la **Société Beli Transit Frets Services (BELTRANS)** selon le CDCFT v1.1
(`docs/cahier_des_charges`). Monorepo **npm workspaces** : frontend et backend séparés.

## Périmètre métier

BELTRANS est basée à **Pointe-Noire** et intervient **uniquement au port et à l'aéroport de
Pointe-Noire**, une fois la marchandise au Congo. Le transport international reste organisé par
le client ou son fournisseur.

| Proposé                                             | Non proposé                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| Services : fret maritime, fret aérien, dédouanement | Transport terrestre, multimodal (URL redirigées en 308 vers `/services`) |
| Opérations : import (arrivée), export (départ)      | Transit vers pays tiers                                                  |

Ces règles sont définies dans `shared/src/labels.ts` et appliquées par l'API : à l'import,
l'arrivée est forcée à Pointe-Noire (République du Congo) ; à l'export, le départ. Les enums SQL
conservent `TERRESTRE`, `MULTIMODAL` et `TRANSIT` (prévus au CDC) pour une éventuelle
extension, mais l'API les refuse.

## Responsive

Mobile-first avec trois paliers : **mobile** (< 640 px), **tablette** (640–1023 px), **desktop**
(≥ 1024 px). Les utilitaires `section-y`, `heading-section` et `eyebrow`
(`frontend/src/app/globals.css`) donnent la même échelle d'espacements et de titres à toutes les
pages. Vérifié en émulation iPhone (390 px) et iPad (820 px), sans défilement horizontal.

```
Projet_Beltrans/
├── frontend/   Next.js 15 (React 19) — site public + wizard de devis        → :3000
├── backend/    Node.js / Express 5 — API REST, Prisma, notifications        → :4000
├── shared/     @beltrans/shared — schéma Zod, libellés, données société (TS)
├── docs/       Cahier des charges
└── legacy/     Anciennes pages HTML (référence)
```

```
Navigateur ──► frontend (Next.js, pages statiques SSG)
     │
     └── POST /api/v1/quotes (CORS) ──► backend (Express)
                                          ├─ Zod (même schéma que le front, via shared/)
                                          ├─ Turnstile · rate limit 3/h/IP
                                          ├─ Prisma ──► PostgreSQL (beltrans_db)
                                          └─ après réponse : Resend · WhatsApp
```

| Couche   | Stack                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind v4, Radix/shadcn, RHF + Zod, Zustand, Framer Motion |
| Backend  | Express 5, TypeScript (tsx en dev, tsup en build), Prisma 6, Helmet, CORS, Pino                 |
| Partagé  | Zod + libphonenumber-js : **une seule définition** des règles de validation                     |
| Services | PostgreSQL, Cloudflare Turnstile, Upstash Redis, Resend, WhatsApp Cloud API, GA4                |

## Démarrage local

Prérequis : Node.js ≥ 20.9, PostgreSQL (base `beltrans_db` créée dans pgAdmin).

```bash
npm install                               # installe les 3 workspaces + génère le client Prisma

# 1. Backend : renseigner le mot de passe PostgreSQL
#    backend/.env  →  DATABASE_URL et DIRECT_URL (…postgres:MOT_DE_PASSE@localhost:5432/beltrans_db)
npm run db:migrate                        # crée les tables QuoteRequest / QuoteCounter dans beltrans_db

# 2. Frontend : backend/.env et frontend/.env.local sont déjà créés depuis les .env.example
npm run dev                               # lance API (:4000) + site (:3000) en parallèle
```

Vérifications : http://localhost:4000/health/ready → `{"database":"up"}` ; site sur http://localhost:3000.
Les tables sont visibles dans pgAdmin : `beltrans_db → Schemas → public → Tables`.

Sans clés Resend / Turnstile / Upstash, tout fonctionne en local : notifications ignorées
(journalisées), Turnstile désactivé, rate limit en mémoire.

### Scripts (racine)

| Script                                           | Rôle                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `npm run dev`                                    | API + site en parallèle (`dev:backend`, `dev:frontend` séparément) |
| `npm run build`                                  | Build backend (`backend/dist`) puis frontend                       |
| `npm run lint` / `typecheck` / `test`            | Sur tous les workspaces                                            |
| `npm run format` / `format:check`                | Prettier                                                           |
| `npm run db:migrate` / `db:deploy` / `db:studio` | Migrations Prisma (dev / prod), Prisma Studio                      |

## Backend — API

| Méthode | Route            | Description                                                        |
| ------- | ---------------- | ------------------------------------------------------------------ |
| POST    | `/api/v1/quotes` | Crée une demande → `201 { reference, whatsappUrl }`                |
| GET     | `/health`        | Liveness                                                           |
| GET     | `/health/ready`  | Readiness (test `SELECT 1` sur la base) → 503 si base indisponible |

Codes d'erreur de `POST /api/v1/quotes` : `400` JSON invalide / honeypot, `403` Turnstile,
`413` corps > 32 ko, `422` validation (`fieldErrors` par champ), `429` rate limit (`Retry-After`),
`500` erreur de persistance.

```
backend/src/
├── server.ts            Démarrage + arrêt propre (SIGINT/SIGTERM)
├── app.ts               Express : helmet, cors, json(32kb), logs, routes, erreurs
├── config/env.ts        Variables d'environnement validées par Zod (fail fast)
├── routes/              quotes.ts, health.ts
├── services/            quote.service.ts (référence atomique), notifications/ (Resend, WhatsApp)
├── middleware/          rate-limit.ts, error-handler.ts
└── lib/                 prisma.ts, logger.ts (Pino), turnstile.ts
```

**Pipeline (CDC §3.1)** : validation Zod → Turnstile → rate limit → transaction Prisma
(incrément `QuoteCounter` + création `QuoteRequest` → référence `BLT-YYYY-XXXXXX` unique, sans
trou) → réponse `201` → notifications (e-mail client, alerte équipe avec boutons Répondre /
WhatsApp / Appeler, alerte WhatsApp optionnelle). Un échec d'envoi n'affecte jamais le prospect.

## Espace admin (suivi des devis)

Accès : **`/admin`** (ex. http://localhost:3000/admin). Un compte unique, non indexé par les moteurs.

```bash
npm run db:migrate                                         # applique la migration admin_space
npm run admin:create -w backend -- contact@beltrans.com    # mot de passe demandé (masqué)
```

Relancer la même commande **réinitialise le mot de passe** et déconnecte les sessions ouvertes.
Mot de passe : 12 caractères minimum, lettres et chiffres.

| Écran            | Fonctions                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tableau de bord  | Demandes reçues, taux de devis envoyés, délais moyens (prise en charge / envoi), demandes par semaine, répartition par statut et service ; période 30 j / 3 mois / 12 mois     |
| Devis            | Recherche (référence, nom, société, e-mail, téléphone), filtres statut / service / période (dans l'URL), pagination, **export de suivi Excel** (.xlsx)                         |
| Fiche d'un devis | Toutes les informations, statut en un clic, notes internes, historique, **« Répondre au client »** : devis Excel pré-rempli → e-mail / WhatsApp pré-rédigés → « Devis envoyé » |

**Suivi automatique des délais** : le premier passage hors de « Nouveau » horodate la prise en
charge (`reviewedAt`), le premier passage à « Devis envoyé » horodate l'envoi (`quotedAt`).

**Rétention (mentions légales)** : chaque jour, l'API anonymise les devis sans activité depuis
**3 ans** (identité, e-mail, téléphone, textes libres effacés ; référence, service, pays et dates
conservés pour les statistiques) et purge les sessions expirées. Exécution manuelle :
`npm run retention -w backend`.

**Sécurité** : mot de passe haché (scrypt), session serveur révocable (seul le SHA-256 du jeton
est stocké), cookie `httpOnly` + `SameSite=Lax` limité à `/api/v1/admin`, contrôle d'origine
sur les modifications (CSRF), 5 tentatives de connexion / 15 min / IP, message d'erreur
identique que l'e-mail existe ou non, réponses `Cache-Control: no-store`, fichiers Excel
générés côté serveur (valeurs texte, aucune formule issue des saisies client). En production, frontend et API doivent partager le même
domaine parent (ex. `www.beltrans.com` + `api.beltrans.com`) pour que le cookie soit transmis.

| Route API (`/api/v1/admin`)                               | Rôle                            |
| --------------------------------------------------------- | ------------------------------- |
| `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | Session                         |
| `GET /stats?from&to`                                      | Indicateurs du tableau de bord  |
| `GET /quotes?status&service&from&to&q&page&pageSize`      | Liste filtrée                   |
| `GET /quotes/export.xlsx`                                 | Export de suivi (mêmes filtres) |
| `GET /quotes/:id/devis.xlsx`                              | Modèle de devis client          |
| `GET /quotes/:id` · `PATCH /quotes/:id`                   | Fiche · statut / notes          |

### Fichiers Excel

| Fichier                                                                      | Contenu                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Modèle de devis** (`Devis-BLT-AAAA-NNNNNN-Nom.xlsx`) — à envoyer au client | En-tête BELTRANS (logo, RCCM, agrément), client et opération pré-remplis, lignes de prestations adaptées au service (maritime / aérien / dédouanement, import / export), **prix unitaires à saisir** (cellules jaunes), calculs automatiques : total prestations HT, TVA (taux modifiable, 18 % par défaut), débours sans TVA, total à payer en FCFA ; conditions, validité 30 jours, zone « Bon pour accord », mise en page A4. **Les notes internes n'y figurent jamais.** |
| **Suivi des devis** (`Suivi-devis-BELTRANS-AAAA-MM-JJ.xlsx`) — usage interne | Feuille « Demandes » (en-tête figé, filtres, statuts colorés, vraies dates, délais en heures, notes internes) + feuille « Synthèse » (répartitions, délais moyens).                                                                                                                                                                                                                                                                                                          |

Le logo des fichiers est lu dans `backend/assets/logo.png`.

### Données de démonstration

```bash
npm run db:seed-demo -w backend             # ajoute 23 demandes fictives (tous statuts)
npm run db:seed-demo -w backend -- --reset  # les supprime (et recale le compteur de références)
```

Elles utilisent le domaine réservé `demo.beltrans.test` : aucun e-mail ne peut partir et elles se
suppriment sans toucher aux vraies demandes. **À supprimer avant la mise en production.**

## Variables d'environnement

- **`backend/.env`** (voir `backend/.env.example`) — obligatoires en production : `DATABASE_URL`,
  `DIRECT_URL`, `CORS_ORIGINS`, `TRUST_PROXY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, `QUOTE_NOTIFICATION_EMAILS`.
- **`frontend/.env.local`** (voir `frontend/.env.example`) : `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_GA_ID`.

## Déploiement

| Élément  | Cible conseillée                    | Points clés                                                                                                                                                             |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | Vercel (Root Directory `frontend`)  | `NEXT_PUBLIC_API_URL=https://api.beltrans.com`                                                                                                                          |
| Backend  | Render / Railway / VPS (Node 22)    | Build `npm ci && npm run build -w backend`, pré-déploiement `npm run db:deploy`, start `npm start -w backend`, `TRUST_PROXY=1`, `CORS_ORIGINS=https://www.beltrans.com` |
| Base     | Supabase / Neon (PostgreSQL managé) | Pooler (6543) pour `DATABASE_URL`, direct (5432) pour `DIRECT_URL`                                                                                                      |

Puis : DNS `www` → Vercel, `api` → backend (SSL), Search Console avec
`https://www.beltrans.com/sitemap.xml`, GA4 : marquer `quote_form_submitted` comme événement clé.

### Maintenance des clés

| Service    | Où                   | Remarques                                                                  |
| ---------- | -------------------- | -------------------------------------------------------------------------- |
| Resend     | API Keys + Domains   | Vérifier le domaine d'envoi (SPF/DKIM)                                     |
| Cloudflare | Turnstile → Add site | Clé de site → frontend, clé secrète → backend                              |
| Upstash    | Redis → REST API     | Indispensable si plusieurs instances du backend                            |
| Meta       | WhatsApp Manager     | Modèle `new_quote_alert` (réf., client, service, trajet) à faire approuver |

## Images & logo

Les visuels **originaux** fournis par BELTRANS sont dans `frontend/assets/images-src/` (non
publiés : jusqu'à 13 Mo par fichier). Le script `npm run images -w frontend` génère les versions
web dans `frontend/public/images/` (17 Mo → < 1 Mo), le logo détouré et les favicons
(`src/app/icon.png`, `apple-icon.png` à partir du globe du logo). `next/image` sert ensuite du
AVIF/WebP à la taille de chaque écran.

| Original (`assets/images-src/`) | Version web (`public/images/`)                   | Utilisation                        |
| ------------------------------- | ------------------------------------------------ | ---------------------------------- |
| `logo/logo final.png`           | `logo.png`, favicons                             | En-tête, pied de page, OG, JSON-LD |
| `arrière plan.avif`             | `hero-port.jpg`                                  | Hero accueil, À propos, image OG   |
| `image nos ser.jpg`             | `services-banner.jpg`, `services/multimodal.jpg` | Page Services, Multimodal          |
| `image maritime.jpg`            | `services/maritime.jpg`                          | Fret maritime                      |
| `image avion 2.jpg`             | `services/aerien.jpg`                            | Fret aérien                        |
| `image 2.jpg`                   | `services/terrestre.jpg`                         | Transport terrestre                |
| `image douane.jpg`              | `services/dedouanement.jpg`                      | Dédouanement                       |
| `image contact.jpeg`            | `contact-banner.jpg`                             | Page Contact                       |

Pour remplacer un visuel : déposer le nouvel original sous le même nom dans
`assets/images-src/`, puis relancer `npm run images -w frontend`.

## Performance & fluidité de navigation

> ⚠️ **Mode dev ≠ production.** `npm run dev` compile chaque page à sa première visite
> (≈ 9 s pour la toute première, puis 1–2 s par nouvelle page, 0,3 s ensuite). Pour juger de la
> vitesse réelle, utiliser **`npm run preview`** (build + serveur de production).

Mesures (production, iPhone émulé en 4G, cache chaud) : accueil chargé en **~0,5 s**,
navigation entre pages en **35–135 ms**, réponses serveur en 5–25 ms.

| Levier                     | Mise en œuvre                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Pages statiques + prefetch | Toutes les pages sont pré-rendues ; `next/link` précharge les liens visibles                                            |
| Retour visuel immédiat     | Barre de progression au clic (`navigation-progress.tsx`), squelette (`app/loading.tsx`)                                 |
| Transitions                | Fondu d'entrée à chaque page (`app/template.tsx`), désactivé si « réduire les animations »                              |
| Images                     | Lazy loading hors écran, hero prioritaire, aperçu flou (`blurProps`), AVIF/WebP, cache 30 jours                         |
| Code à la demande          | Menu mobile, fenêtre de succès du devis et animations framer-motion chargés à la demande (`next/dynamic`, `LazyMotion`) |
| Rendu différé              | `content-visibility: auto` sur les sections hors écran de l'accueil (`cv-auto`)                                         |
| Scripts tiers              | Google Analytics en `lazyOnload`, Turnstile chargé uniquement à l'étape 4                                               |

**Astuce Windows (développement)** : l'antivirus analyse chaque fichier compilé. Ajouter le dossier
du projet aux exclusions de Microsoft Defender accélère nettement `npm run dev` et `npm install`
(Sécurité Windows → Protection contre les virus → Exclusions).

## Qualité, SEO & accessibilité (CDC §3.2)

- Pages publiques pré-rendues (SSG), polices `next/font` en `swap`, GA après interactivité.
- Métadonnées par page, image OG générée, sitemap, robots, manifest ; JSON-LD `LocalBusiness`,
  `Service`, `BreadcrumbList`, `FAQPage` (`LogisticsService` n'existant pas dans
  schema.org, les prestations sont décrites en `Service`).
- WCAG 2.1 AA : lien d'évitement, focus visible, modales Radix, erreurs reliées aux champs,
  `aria-live`, `prefers-reduced-motion`.
- Sécurité API : Helmet, CORS restreint, corps limité à 32 ko, honeypot, Turnstile, rate limit,
  validation stricte, logs sans données sensibles.
- Tests : `shared` (règles de validation) et `backend` (API avec Supertest). Pipeline CI :
  format → lint → types → tests → build.

## À valider par BELTRANS (Phase 1 du CDC)

Points marqués `TODO(validation)` : adresse du siège (`shared/src/company.ts`), réseaux sociaux,
détail des services, FAQ, « À propos », mentions légales.

La rubrique « Actualités » a été retirée du site : les anciennes adresses `/actualites/…`
redirigent vers l'accueil (301).

Visuels à améliorer : logo en **SVG** (livrable CDC §5 ; le PNG actuel suffit à l'écran) ; photos
en plus haute définition (≥ 1920 px de large) pour `arrière plan` (899 px), `image avion 2`
(608 px), `image 2` et `image douane` (735 px), un peu douces sur grand écran.
