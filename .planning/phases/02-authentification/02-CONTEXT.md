# Phase 2: Authentification - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Inscription, connexion, sessions, OAuth Google/Facebook, RBAC, validation tunisienne, verification email/telephone, reset mot de passe, 2FA optionnel et detection connexion suspecte. Tout le cycle d'authentification pour que les utilisateurs puissent creer un compte et acceder a la plateforme selon leur role (CLIENT, PROVIDER, ADMIN).

</domain>

<decisions>
## Implementation Decisions

### Registration flow
- Multi-step wizard (3+ steps with progress indicator), mobile-first
- Step 1: Role selection via radio cards ("Je cherche un service" / "Je propose mes services") with icons
- Step 2: Prenom, nom, email, telephone (+216 format or 8 digits)
- Step 3: Mot de passe (8+ chars, bcrypt hashing), acceptation CGU
- Step 4 (inline): Verification SMS OTP (6 digits) integrated as final wizard step
- Same form fields for CLIENT and PROVIDER — provider-specific info collected later in Phase 4
- Unique email and phone enforced at registration
- After registration: user lands on dashboard with persistent warning banner "Compte non verifie" until email verified — not a blocking gate page

### Login & OAuth experience
- Email/password login + Google OAuth + Facebook OAuth
- Social login buttons visible on login page alongside email form
- First-time OAuth login: show role selection screen ("Qui etes-vous?") before creating account
- Same-email auto-linking: if email already exists, OAuth provider is automatically linked to existing account
- Post-login redirect by role: CLIENT → /dashboard, PROVIDER → /provider/dashboard, ADMIN → /admin
- Progressive lockout: 3 failed attempts → CAPTCHA challenge; 5 more failures with CAPTCHA → 15-minute time lock
- Clear error messages in French for all failure scenarios

### Phone & email verification
- SMS OTP: simulated behind an ISmsService abstraction interface (console log + stored code in dev, pluggable for real Twilio/Vonage later)
- OTP input inline as final step of registration wizard — no separate page redirect
- 6-digit OTP code with resend button and countdown timer
- Email verification: magic link (click to verify) sent via Resend (real email delivery, free tier 100/day)
- Password reset: email with magic link → new password form → confirmation, token expires after 1 hour

### Session & security
- Session duration: 30 days with "Se souvenir de moi" checkbox; without checkbox, session expires on browser close
- NextAuth.js for session management (JWT strategy)
- Optional 2FA: user can choose between TOTP (authenticator app with QR code) or SMS-based OTP
- 2FA setup accessible from account settings, not mandatory
- Suspicious login detection: email notification triggered by new device/browser OR new IP geographic location
- User-agent + IP geolocation tracking for device recognition

### RBAC
- Three roles: CLIENT, PROVIDER, ADMIN
- Route protection via middleware: unauthorized access redirects to 403 page or login
- RoleGuard component for conditional UI rendering by role

### Claude's Discretion
- Exact wizard step transitions and animations
- Password strength indicator design
- CAPTCHA provider choice (reCAPTCHA, hCaptcha, etc.)
- IP geolocation service/library choice
- TOTP library choice
- Email template design and layout
- Error toast/notification styling
- 403 page design

</decisions>

<specifics>
## Specific Ideas

- CDC specifies: email, password (8+ chars), mobile phone, first/last name, T&Cs acceptance as required registration fields
- CDC specifies: bcrypt password hashing, secure session tokens
- CDC specifies: 3-attempt lockout with CAPTCHA
- Phone must validate Tunisian format: +216 prefix or 8 digits
- Registration wizard should feel modern and clean, consistent with Phase 1 shadcn/ui design tokens

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Note: 2FA and suspicious login detection are included in this phase per user decision (originally listed as v2 in REQUIREMENTS.md but user wants them in Phase 2).

</deferred>

---

*Phase: 02-authentification*
*Context gathered: 2026-02-22*
