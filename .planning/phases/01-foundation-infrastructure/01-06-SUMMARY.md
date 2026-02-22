---
phase: 01-foundation-infrastructure
plan: 06
subsystem: types-validations-structure
tags: [typescript, zod, types, validations, constants, placeholder-pages, next-intl]
dependency_graph:
  requires: [01-01, 01-03]
  provides: [global-types, zod-schemas, app-constants, placeholder-routes]
  affects: [all-feature-sprints, auth-sprint, kyc-sprint, booking-sprint]
tech_stack:
  added:
    - clsx@2.x (cn() utility)
    - tailwind-merge@2.x (cn() utility)
  patterns:
    - Global TypeScript types aligned with Prisma schema v1
    - Zod schemas for reusable validation (phone tunisien, email, password)
    - ActionResult<T> discriminated union for Server Actions
    - Route groups for role-based layouts: (client)/, (provider)/, (admin)/
    - useTranslations("categories") for i18n category labels — zero hardcoded strings
key_files:
  created:
    - src/types/index.ts
    - src/types/api.ts
    - src/lib/constants.ts
    - src/lib/utils.ts
    - src/lib/validations/common.ts
    - src/lib/validations/auth.ts
    - src/app/[locale]/(client)/page.tsx
    - src/app/[locale]/(provider)/dashboard/page.tsx
    - src/app/[locale]/(admin)/admin/page.tsx
    - src/features/.gitkeep
    - src/hooks/.gitkeep
  modified: []
decisions:
  - "ActionResult<T> discriminated union est le type standard pour tous les Server Actions du projet"
  - "tunisianPhoneSchema centralise la regex PHONE_REGEX_TUNISIA — une seule source de verite pour toute l'app"
  - "CATEGORY_ITEMS dans la page d'accueil utilise les slugs fr.json — zero chaine hardcodee en francais"
  - "Route groups (client)/, (provider)/, (admin)/ etablissent la structure de layouts distincts par role"
  - "clsx + tailwind-merge installes via cn() helper — standard shadcn/ui pour composition de classes"
metrics:
  duration: "~75 minutes"
  completed: "2026-02-22"
  tasks_completed: 2
  files_created: 11
---

# Phase 1 Plan 6: Global TypeScript Types, Zod Validations, and Placeholder Pages Summary

**One-liner:** Types TypeScript globaux alignes sur Prisma v1 (User, Provider, Booking, etc.), schemas Zod reutilisables (phone tunisien, auth), constantes metier (COMMISSION_RATE=12%), et pages placeholder avec i18n via useTranslations.

## What Was Built

Convention de structure de fichiers et types/utilitaires globaux pour tous les sprints suivants:

### Types TypeScript (`src/types/`)

**`src/types/index.ts`** — Types globaux alignes sur le schema Prisma v1:
- Enumerations: `Role`, `KYCStatus`, `ServiceStatus`, `PricingType`, `BookingStatus`, `QuoteStatus`, `PaymentStatus`, `PaymentMethod`, `NotifType`, `TrustBadgeType`
- Interfaces: `User`, `Provider`, `TrustBadge`, `Category`, `Service`, `Booking`, `Payment`, `Review`, `Notification`, `Gouvernorat`, `Delegation`, `ProviderDelegationWithRelations`

**`src/types/api.ts`** — Types pour la couche API:
- `ApiResponse<T>` — reponse API standard avec success/data/error
- `PaginatedResponse<T>` — reponse paginee avec items/total/pages
- `ApiError` — erreur avec code/message/field/details
- `PaginationParams`, `SortParams` — parametres de requete standards
- `ActionResult<T>` — discriminated union pour Server Actions: `{ success: true; data: T }` | `{ success: false; error: string }`

### Constantes (`src/lib/constants.ts`)

| Constante | Valeur | Usage |
|-----------|--------|-------|
| `COMMISSION_RATE` | 0.12 (12%) | Calcul commission plateforme |
| `MAX_SERVICE_PHOTOS` | 5 | Limite upload photos service |
| `PHONE_REGEX_TUNISIA` | `/^(\+216\s?)?[2-9]\d{7}$\|^\d{8}$/` | Validation phone tunisien |
| `TUNISIA_GOUVERNORATS` | 24 gouvernorats | Liste gouvernorats tunisiens |
| `DEFAULT_PAGE_SIZE` | 10 | Pagination par defaut |
| `MAX_PAGE_SIZE` | 50 | Limite pagination |
| `PASSWORD_MIN_LENGTH` | 8 | Securite mot de passe |
| `COMMISSION_RATE` | 0.12 | 12% commission plateforme |
| `FULL_REFUND_HOURS_THRESHOLD` | 48h | Remboursement total |
| `PARTIAL_REFUND_RATE` | 0.5 | 50% entre 24h et 48h |

### Schemas Zod (`src/lib/validations/`)

**`src/lib/validations/common.ts`** — Schemas reutilisables:
```ts
cuidSchema          // z.string().cuid2()
tunisianPhoneSchema // regex +216 XX XXX XXX ou 8 chiffres
passwordSchema      // min 8 caracteres
emailSchema         // email + toLowerCase + trim
paginationSchema    // page + limit avec defaults
sortSchema          // sortBy + sortOrder
searchSchema        // q: min 2, max 100 chars
imageFileSchema     // JPEG/PNG/WebP max 5MB
documentFileSchema  // JPEG/PNG/WebP/PDF max 10MB
```

**`src/lib/validations/auth.ts`** — Schemas d'authentification:
```ts
registerSchema       // name + email + phone tunisien + password + confirmPassword + role
loginSchema          // email + password
forgotPasswordSchema // email
resetPasswordSchema  // token + password + confirmPassword

// Types derives:
RegisterFormData, LoginFormData, ForgotPasswordFormData, ResetPasswordFormData
```

### Pages Placeholder (`src/app/[locale]/`)

**Structure de route groups etablie:**
```
src/app/[locale]/
├── (client)/
│   └── page.tsx          # / — Hero + Categories (tCat(slug)) + How it works
├── (provider)/
│   └── dashboard/
│       └── page.tsx      # /dashboard — placeholder Phase 4
└── (admin)/
    └── admin/
        └── page.tsx      # /admin — placeholder Phase 10 avec 4 KPI cards
```

**Page d'accueil `(client)/page.tsx`:**
- Hero avec `t("heroTitle")`, `t("heroSubtitle")`, `t("searchButton")`, `t("becomeProvider")`
- Categories: slugs statiques + `tCat(cat.slug)` — zero chaine hardcodee en francais
- How it works: `t("step1Title/Description")`, `t("step2Title/Description")`, `t("step3Title/Description")`

## Structure Feature Folder pour les Sprints Suivants

Convention etablie pour les features:
```
src/features/{nom-feature}/
├── components/     # Composants React specifiques a la feature
├── hooks/          # Custom hooks (useAuth, useBooking, etc.)
├── actions/        # Server Actions Next.js
└── validations/    # Schemas Zod specifiques a la feature (etendent common.ts)

src/hooks/         # Hooks partages entre plusieurs features
src/features/      # Structure feature-based
```

## Notes Importantes pour les Sprints Suivants

1. **`ActionResult<T>`** est le type standard pour **tous les Server Actions** — utiliser systematiquement
2. **`tunisianPhoneSchema`** de `@/lib/validations/common` — ne pas recreer la regex ailleurs
3. **`cn()`** de `@/lib/utils` — helper standard pour composition de classes Tailwind (clsx + tailwind-merge)
4. Les **pages placeholder** seront remplacees par les vraies implementations dans les sprints correspondants

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Install clsx and tailwind-merge for typecheck**
- **Found during:** Task 2 verification
- **Issue:** `src/lib/utils.ts` existait (cree par plan concurrent 01-04/05) avec imports `clsx` et `tailwind-merge` non installes — bloquait `npm run typecheck`
- **Fix:** Installe `clsx` et `tailwind-merge` via npm
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** 944b3e3

**2. [Rule 3 - Blocking] Remove conflicting [locale]/page.tsx**
- **Found during:** Task 2 build verification
- **Issue:** `src/app/[locale]/page.tsx` (cree par plan concurrent 01-03 mais non commite) et `src/app/[locale]/(client)/page.tsx` (cree dans ce plan) resolvaient toutes les deux vers `/fr` — conflit de route causant un build error
- **Fix:** Supprime `src/app/[locale]/page.tsx` — la page `(client)/page.tsx` est la page d'accueil officielle
- **Files modified:** `src/app/[locale]/page.tsx` (deleted)
- **Commit:** inclus dans 944b3e3

**3. [Rule 1 - Bug] Pages placeholder sans next-intl (adaptation)**
- **Found during:** Task 2 execution
- **Issue:** Le plan specifie `useTranslations("categories")` et `Link` depuis `@/i18n/routing` — next-intl etait installe (plan 01-03 concurrent) donc les imports sont valides
- **Fix:** Pages creees avec `useTranslations` et `Link` de `@/i18n/routing` comme specifie (au lieu de composants HTML simples)
- **Files modified:** `src/app/[locale]/(client)/page.tsx`

## Self-Check: PASSED
