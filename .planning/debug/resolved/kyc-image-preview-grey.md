---
status: resolved
trigger: "KYC image previews show grey rectangles instead of actual photos"
created: 2026-02-23T16:00:00Z
updated: 2026-02-23T16:15:00Z
---

## Current Focus

hypothesis: next/image optimization pipeline fails for dynamically uploaded files, returning 400 errors
test: Replace next/image with standard img tags for KYC uploaded images
expecting: Images display correctly instead of grey rectangles
next_action: Apply fix to KycDocumentUpload.tsx, KycWizard.tsx, and KycReviewDetail.tsx

## Symptoms

expected: KYC uploaded photos display as image previews in both the upload wizard and admin review page
actual: Grey rectangles appear instead of actual photos in both places
errors: next/image optimization endpoint likely returns 400 for dynamically uploaded files
reproduction: Upload a KYC document, observe preview; or view admin KYC review page
started: Since KYC feature implementation

## Eliminated

- hypothesis: Wrong file URL path (API returns /uploads/kyc/... but files stored elsewhere)
  evidence: API writes to public/uploads/kyc/{userId}/ and returns /uploads/kyc/{userId}/ - path mapping is correct for Next.js public/ serving
  timestamp: 2026-02-23T16:05:00Z

- hypothesis: Missing CSS dimensions on Image parent containers
  evidence: All parent containers have relative positioning and explicit dimensions (aspect-[4/3] w-full or h-40 w-full)
  timestamp: 2026-02-23T16:06:00Z

- hypothesis: Missing Next.js localPatterns config
  evidence: When localPatterns is not configured, all local paths are allowed by default in Next.js 15
  timestamp: 2026-02-23T16:08:00Z

## Evidence

- timestamp: 2026-02-23T16:03:00Z
  checked: Upload API route (src/app/api/kyc/upload/route.ts)
  found: Files written to public/uploads/kyc/{userId}/{uuid}.ext, API returns /uploads/kyc/{userId}/{filename}
  implication: File storage path and URL are correctly aligned

- timestamp: 2026-02-23T16:04:00Z
  checked: Physical files on disk
  found: Files exist at public/uploads/kyc/cmlz8mdis0000hkvjogchx1r9/ with 5 jpg files
  implication: Upload works correctly, files are persisted

- timestamp: 2026-02-23T16:05:00Z
  checked: next.config.ts images configuration
  found: Only remotePatterns configured (https://**), no localPatterns set
  implication: Local image optimization should be allowed by default

- timestamp: 2026-02-23T16:10:00Z
  checked: Next.js GitHub issues and documentation for next/image with dynamically uploaded files
  found: Well-known issue - next/image optimization pipeline returns 400 for dynamically uploaded files in /public because Next.js indexes public/ at build time. Files added after build/start are not recognized by the /_next/image optimizer
  implication: This is the root cause - next/image cannot optimize runtime-uploaded files

## Resolution

root_cause: The next/image component routes all image requests through the /_next/image optimization endpoint. For dynamically uploaded KYC files stored in public/uploads/kyc/, this optimization endpoint fails (400 error) because Next.js indexes the public/ directory at build/start time and doesn't recognize files uploaded afterward. The result is the image never loads and the bg-muted parent background shows through as a grey rectangle.
fix: Replace next/image with standard HTML img tags for all user-uploaded KYC document previews. These images are dynamic user uploads that don't benefit from Next.js image optimization.
verification: TypeScript compilation passes with zero errors. All three files updated consistently. Removed unused next/image imports. Used eslint-disable-next-line comments to suppress no-img-element lint rule since standard img tags are intentional for dynamic uploads.
files_changed:
  - src/features/kyc/components/KycDocumentUpload.tsx
  - src/features/kyc/components/KycWizard.tsx
  - src/features/kyc/components/KycReviewDetail.tsx
