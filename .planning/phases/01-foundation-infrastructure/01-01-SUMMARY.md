---
phase: 01-foundation-infrastructure
plan: 01
subsystem: project-scaffold
tags: [next.js, typescript, eslint, prettier, zod, tailwindcss, app-router]
dependency_graph:
  requires: []
  provides: [next-app-scaffold, typescript-config, eslint-config, prettier-config, env-validation]
  affects: [all-subsequent-plans]
tech_stack:
  added:
    - next@15.1.8
    - react@19.0.0
    - typescript@5.9.3
    - tailwindcss@3.4.19
    - eslint@9.x with next/core-web-vitals + @typescript-eslint/recommended
    - prettier@3.8.1 with prettier-plugin-tailwindcss@0.6.9
    - zod@3.25.76
  patterns:
    - App Router (Next.js 15)
    - TypeScript strict mode avec noUncheckedIndexedAccess
    - Path aliases @/* -> ./src/*
    - Zod schema validation pour env vars
    - Prettier + ESLint sans conflit (next/typescript gere l'integration)
key_files:
  created:
    - package.json
    - tsconfig.json
    - next.config.ts
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/app/globals.css
    - .gitignore
    - .eslintrc.json
    - .prettierrc
    - .prettierignore
    - src/env.ts
    - .env.example
  modified: []
decisions:
  - "Next.js 15.1.8 (latest stable) avec App Router — pas de Pages Router"
  - "TypeScript strict: true + noUncheckedIndexedAccess: true pour securite maximale"
  - "exactOptionalPropertyTypes: false pour compatibilite pratique avec libraries tierces"
  - "typedRoutes: true dans next.config.ts pour validation des routes au compile-time"
  - "prettier-plugin-tailwindcss pour tri automatique des classes Tailwind"
  - "Zod directement dans src/env.ts (pattern T3 simplifie sans @t3-oss/env-nextjs)"
  - ".env.local ignore par git (.gitignore inclut .env.local et *.env)"
metrics:
  duration: "~25 minutes"
  completed: "2026-02-22"
  tasks_completed: 2
  files_created: 12
---

# Phase 1 Plan 1: Next.js 15 Initialization + TypeScript + ESLint + Prettier Summary

**One-liner:** Next.js 15.1.8 App Router scaffold avec TypeScript strict (noUncheckedIndexedAccess), ESLint @typescript-eslint/recommended, Prettier + tailwind class sorting, et validation Zod des env vars.

## What Was Built

Un projet Next.js 15 entierement configure comme fondation du projet Tawa Services. Le projet demarre (`npm run dev`), build (`npm run build`), passe le lint (`npm run lint`) et le typecheck (`npm run typecheck`) sans aucune erreur.

## Package Versions Exactes Installes

| Package | Version specifiee | Version installee |
|---------|-------------------|-------------------|
| next | 15.1.8 | 15.1.8 |
| react | ^19.0.0 | 19.x |
| typescript | ^5.0.0 | 5.9.3 |
| tailwindcss | ^3.4.17 | 3.4.19 |
| eslint | ^9.0.0 | 9.x |
| eslint-config-next | 15.1.8 | 15.1.8 |
| @typescript-eslint/eslint-plugin | ^8.0.0 | 8.x |
| @typescript-eslint/parser | ^8.0.0 | 8.x |
| prettier | ^3.4.2 | 3.8.1 |
| prettier-plugin-tailwindcss | ^0.6.9 | 0.6.9 |
| zod | ^3.24.1 | 3.25.76 |

## Structure de Dossier Cree

```
tawa-services/
├── src/
│   ├── app/
│   │   ├── globals.css        # Styles Tailwind globaux
│   │   ├── layout.tsx         # Root layout App Router (lang="fr", Geist font)
│   │   └── page.tsx           # Page d'accueil placeholder "Tawa Services"
│   └── env.ts                 # Validation Zod des variables d'environnement
├── public/
│   └── .gitkeep
├── .env.example               # Documentation des variables requises
├── .eslintrc.json             # ESLint: next/core-web-vitals + @typescript-eslint/recommended
├── .gitignore                 # Inclut .env, .env.local, *.env
├── .prettierignore            # Exclut node_modules, .next, dist, build, *.lock
├── .prettierrc                # Prettier: semi, 100 printWidth, prettier-plugin-tailwindcss
├── next.config.ts             # typedRoutes: true, remotePatterns HTTPS
├── package.json               # Scripts: dev, build, lint, format, format:check, typecheck
├── postcss.config.mjs         # PostCSS pour Tailwind
├── tailwind.config.ts         # Configuration Tailwind CSS
└── tsconfig.json              # strict: true, noUncheckedIndexedAccess, paths @/*
```

## Scripts NPM Disponibles

| Script | Commande | Statut |
|--------|----------|--------|
| `npm run dev` | `next dev` | Demarre sur http://localhost:3000 |
| `npm run build` | `next build` | Build production valide (exit 0) |
| `npm run start` | `next start` | Serveur production |
| `npm run lint` | `next lint` | Exit 0, aucune erreur |
| `npm run typecheck` | `tsc --noEmit` | Exit 0, types corrects |
| `npm run format` | `prettier --write "src/**/*.{ts,tsx,json}"` | Formate les fichiers |
| `npm run format:check` | `prettier --check "src/**/*.{ts,tsx,json}"` | Verifie le format (CI) |

## Configuration TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Variables d'Environnement (src/env.ts)

Schema Zod valide les variables au demarrage:
- `NODE_ENV`: enum development/test/production (default: development)
- `DATABASE_URL`: URL PostgreSQL (requis)
- `NEXTAUTH_SECRET`: string min 32 chars (requis)
- `NEXTAUTH_URL`: URL optionnel
- `NEXT_PUBLIC_APP_URL`: URL client optionnel

## Decisions Techniques

1. **Next.js 15.1.8 App Router** — Pas de Pages Router. Tous les plans suivants utilisent l'App Router.
2. **TypeScript strict + noUncheckedIndexedAccess** — Securite maximale pour eviter bugs d'index.
3. **exactOptionalPropertyTypes: false** — Compatibilite avec libraries tierces (next-auth, prisma, etc.).
4. **typedRoutes: true** — Validation compile-time des routes Next.js pour eviter les typos.
5. **Pattern T3 simplifie** — Zod directement dans `src/env.ts` sans wrapper externe.
6. **prettier-plugin-tailwindcss** — Tri automatique des classes Tailwind, evite les conflits de merge.

## Verification Finale

| Commande | Resultat |
|----------|----------|
| `npm run build` | Build OK, 4 pages statiques generees |
| `npm run lint` | No ESLint warnings or errors |
| `npm run typecheck` | Exit 0, aucune erreur TypeScript |
| `npm run format:check` | All matched files use Prettier code style! |

## Deviations from Plan

None - plan execute exactement tel qu'ecrit.

Note: Les fichiers de configuration (package.json avec scripts format/format:check/typecheck) etaient deja en partie presents depuis la creation initiale du projet. Le travail a consiste a completer la configuration manquante et creer les fichiers absents.

## Self-Check: PASSED
