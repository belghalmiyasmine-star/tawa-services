# Plan du Rapport PFE — Tawa Services

## Table des Matieres et Correspondance avec les Documents

Ce document sert de **table des matieres detaillee** du rapport PFE, avec pour chaque section la reference au document source dans `docs/`.

---

## Pages Liminaires

| Section | Contenu | Source |
|---------|---------|--------|
| Page de garde | Titre, nom, encadrant, annee, logo universite | A rediger |
| Dedicace | Texte personnel | A rediger |
| Remerciements | Encadrant, universite, contributeurs | A rediger |
| Table des matieres | Generee automatiquement | Auto |
| Liste des figures | Tous les diagrammes UML + captures ecran | Auto |
| Liste des tableaux | Tous les tableaux (backlog, tests, metriques) | Auto |
| Liste des abreviations | KYC, RBAC, JWT, ORM, API, etc. | A compiler |

---

## Introduction Generale (~2 pages)

| Sous-section | Contenu | Source |
|-------------|---------|--------|
| Contexte | Marche des services a domicile en Tunisie, lacunes actuelles | `CONCEPTION.md` §0.1 |
| Problematique | "En Tunisie, les particuliers ne disposent pas d'un moyen centralise..." | `CONCEPTION.md` §0.1 |
| Objectifs | Ce que le PFE vise a accomplir | `CONCEPTION.md` §0.2 |
| Plan du rapport | Description des chapitres | Ce document |

---

## PARTIE 1 : Etude et Analyse

### Chapitre 1 : Contexte du Projet (~15 pages)

#### 1.1 Presentation de l'organisme d'accueil (~2 pages)
| Contenu | Source |
|---------|--------|
| Presentation de l'entreprise / universite | A rediger |
| Organigramme | A rediger |
| Activites principales | A rediger |

#### 1.2 Problematique et Motivation (~2 pages)
| Contenu | Source |
|---------|--------|
| Problematique metier detaillee | `CONCEPTION.md` §0.1 |
| Constats terrain (5 points) | `CONCEPTION.md` §0.1 |
| Motivation du projet | `CONCEPTION.md` §0.2 |

#### 1.3 Vision du Produit (~2 pages)
| Contenu | Source |
|---------|--------|
| Tableau probleme → solution | `CONCEPTION.md` §0.2 |
| Proposition de valeur Tawa Services | `CONCEPTION.md` §0.2 |
| Perimetre fonctionnel (inclus vs exclu) | `CONCEPTION.md` §0.3 |

#### 1.4 Etude de l'Existant (~3 pages)
| Contenu | Source |
|---------|--------|
| Solutions existantes en Tunisie et dans le monde | A rediger (benchmarking) |
| Tableau comparatif (Tawa vs concurrents) | A rediger |
| Avantages differenciateurs de Tawa Services | `CONCEPTION.md` §0.2 |

#### 1.5 Methodologie de Travail (~3 pages)
| Contenu | Source |
|---------|--------|
| Presentation de Scrum | `CONCEPTION.md` §0.6 |
| Adaptation au contexte PFE (sprints courts, equipe 1 personne) | `CONCEPTION.md` §0.6 |
| Outils utilises (Git, VS Code, Prisma Studio, PlantUML) | `CONCEPTION.md` §0.6 |
| Tableau recapitulatif sprints | `SPRINT_LOG.md` resume |

#### 1.6 Architecture Technique (~3 pages)
| Contenu | Source |
|---------|--------|
| Stack technologique (tableau complet) | `TECHNICAL_ARCHITECTURE.md` |
| Diagramme de composants | `CONCEPTION.md` §5 |
| Diagramme de deploiement | `CONCEPTION.md` §6 |
| Diagramme de contexte | `CONCEPTION.md` §0.5 |
| Justification des choix techniques | `TECHNICAL_ARCHITECTURE.md` |

---

### Chapitre 2 : Analyse des Besoins (~15 pages)

#### 2.1 Identification des Acteurs (~2 pages)
| Contenu | Source |
|---------|--------|
| Tableau parties prenantes | `CONCEPTION.md` §0.4 |
| Description detaillee de chaque acteur | `CONCEPTION.md` §0.4 |
| Diagramme de contexte | `CONCEPTION.md` §0.5 |

#### 2.2 Besoins Fonctionnels (~5 pages)
| Contenu | Source |
|---------|--------|
| Themes 1-8 avec epics et features | `PRODUCT_BACKLOG_STRUCTURED.md` |
| Diagrammes de cas d'utilisation par acteur | `CONCEPTION.md` §1 |
| Tableau resume backlog (stories, SP, MoSCoW) | `PRODUCT_BACKLOG_STRUCTURED.md` resume |

#### 2.3 Besoins Non Fonctionnels (~2 pages)
| Contenu | Source |
|---------|--------|
| Securite : RBAC, 2FA, rate limiting, validation Zod | `TESTS.md` §3 |
| Performance : temps chargement, polling, lazy-load | `TESTS.md` §4 |
| Accessibilite : responsive, dark mode, i18n 3 langues | `TECHNICAL_ARCHITECTURE.md` |
| Fiabilite : soft delete, escrow, error boundaries | `TECHNICAL_ARCHITECTURE.md` |

#### 2.4 Product Backlog Complet (~5 pages)
| Contenu | Source |
|---------|--------|
| Backlog hierarchique (Theme → Epic → Feature → User Story) | `PRODUCT_BACKLOG_STRUCTURED.md` |
| Format INVEST pour chaque story | `PRODUCT_BACKLOG_STRUCTURED.md` |
| Priorites MoSCoW | `PRODUCT_BACKLOG_STRUCTURED.md` |
| Story points et estimation | `PRODUCT_BACKLOG_STRUCTURED.md` |
| Criteres d'acceptation | `PRODUCT_BACKLOG_STRUCTURED.md` |

#### 2.5 Diagramme de Classes Global (~1 page)
| Contenu | Source |
|---------|--------|
| Diagramme de classes complet (15 classes) | `CONCEPTION.md` §2 |
| Description des relations | `CONCEPTION.md` §2 |

---

## PARTIE 2 : Realisation (Un chapitre par sprint)

### Chapitre 3 : Sprint 1 — Fondation, Auth, KYC, Services, Recherche, Reservation (~20 pages)

#### 3.1 Sprint Planning (~2 pages)
| Contenu | Source |
|---------|--------|
| Objectif du sprint | `SPRINT_LOG.md` Sprint 1 Planning |
| User stories selectionnees (35 stories, 143 SP) | `SPRINT_LOG.md` Sprint 1 Planning |
| Estimation Planning Poker | `SPRINT_LOG.md` Sprint 1 Planning |
| Definition of Done | `SPRINT_LOG.md` Sprint 1 DoD |

#### 3.2 Analyse et Conception (~6 pages)
| Contenu | Source |
|---------|--------|
| Diagramme de cas d'utilisation (Visiteur, Client, Prestataire) | `CONCEPTION.md` §1 (3 diagrammes) |
| Diagramme de classes Sprint 1 (User, Provider, Service, Booking) | `CONCEPTION.md` §8.1.1 |
| Diagramme de sequence : Inscription 3 etapes | `CONCEPTION.md` §3.1 |
| Diagramme de sequence : Login + 2FA | `CONCEPTION.md` §3.2 |
| Diagramme de sequence : Recherche de service | `CONCEPTION.md` §8.1.3 |
| Diagramme d'activite : Flux KYC | `CONCEPTION.md` §4.3 |
| Diagramme d'activite : Inscription multi-etapes | `CONCEPTION.md` §8.1.2 |
| Diagramme de deploiement | `CONCEPTION.md` §6 |

#### 3.3 Realisation (~8 pages)
| Contenu | Source |
|---------|--------|
| Infrastructure (Next.js 15, Prisma, shadcn/ui, layouts) | `SPRINT_LOG.md` Phase 1 |
| Auth (NextAuth, wizard, OAuth, email verif, 2FA) | `SPRINT_LOG.md` Phase 2 |
| KYC (upload, wizard 4 etapes, admin review, badges) | `SPRINT_LOG.md` Phase 3 |
| Profils & Services (CRUD, photos, disponibilites, zones) | `SPRINT_LOG.md` Phase 4 |
| Recherche (API, autocompletion, filtres, categories) | `SPRINT_LOG.md` Phase 5 |
| Reservation (wizard, devis, annulation, dashboard provider) | `SPRINT_LOG.md` Phase 6 |
| **Captures d'ecran** : page login, register wizard, KYC wizard, page service, recherche, booking wizard | A capturer |

#### 3.4 Tests Sprint 1 (~2 pages)
| Contenu | Source |
|---------|--------|
| Tests fonctionnels Auth (TF-AUTH-01 a TF-AUTH-15) | `TESTS.md` §2.1 |
| Tests fonctionnels Booking (TF-BOOK-01 a TF-BOOK-14) | `TESTS.md` §2.2 |
| Tests securite RBAC (TS-RBAC-01 a TS-RBAC-06) | `TESTS.md` §3.4 |

#### 3.5 Sprint Review & Retrospective (~2 pages)
| Contenu | Source |
|---------|--------|
| Fonctionnalites livrees + retour parties prenantes | `SPRINT_LOG.md` Sprint 1 Review |
| Retrospective (bien marche, problemes, ameliorations) | `SPRINT_LOG.md` Sprint 1 Retro |
| Burndown (35 stories, 143 SP, 3 jours) | `SPRINT_LOG.md` Sprint 1 Burndown |

---

### Chapitre 4 : Sprint 2 — Paiement, Avis, Messagerie, Administration (~20 pages)

#### 4.1 Sprint Planning (~2 pages)
| Contenu | Source |
|---------|--------|
| Objectif du sprint | `SPRINT_LOG.md` Sprint 2 Planning |
| User stories selectionnees (26 stories, 120 SP) | `SPRINT_LOG.md` Sprint 2 Planning |
| Estimation Planning Poker | `SPRINT_LOG.md` Sprint 2 Planning |
| Definition of Done | `SPRINT_LOG.md` Sprint 2 DoD |

#### 4.2 Analyse et Conception (~6 pages)
| Contenu | Source |
|---------|--------|
| Diagramme de classes Sprint 2 (Payment, Review, Message) | `CONCEPTION.md` §8.2.1 |
| Diagramme de sequence : Paiement escrow | `CONCEPTION.md` §3.4 |
| Diagramme de sequence : Checkout complet | `CONCEPTION.md` §8.2.2 |
| Diagramme de sequence : Flux d'avis | `CONCEPTION.md` §3.5 |
| Diagramme de sequence : Messagerie | `CONCEPTION.md` §3.6 |
| Diagramme d'activite : Cycle paiement | `CONCEPTION.md` §4.2 |
| Diagramme d'activite : Publication avis double-aveugle | `CONCEPTION.md` §8.2.3 |
| Diagramme d'activite : Moderation messages | `CONCEPTION.md` §8.2.4 |

#### 4.3 Realisation (~8 pages)
| Contenu | Source |
|---------|--------|
| Paiement (IPaymentService, checkout, escrow, commission 12%) | `SPRINT_LOG.md` Phase 7 |
| Avis (4 criteres, double-aveugle, moderation auto, sentiment) | `SPRINT_LOG.md` Phase 8 |
| Messagerie (polling, moderation, notifications, preferences) | `SPRINT_LOG.md` Phase 9 |
| Admin (dashboard KPIs, gestion users/services, signalements SLA, analytics, exports) | `SPRINT_LOG.md` Phase 10 |
| **Captures d'ecran** : checkout, facture, formulaire avis, chat, dashboard admin, analytics, signalements | A capturer |

#### 4.4 Tests Sprint 2 (~2 pages)
| Contenu | Source |
|---------|--------|
| Tests fonctionnels Paiement (TF-PAY-01 a TF-PAY-10) | `TESTS.md` §2.3 |
| Tests fonctionnels Avis (TF-REVW-01 a TF-REVW-09) | `TESTS.md` §2.4 |
| Tests fonctionnels Messagerie (TF-MSG-01 a TF-MSG-09) | `TESTS.md` §2.5 |
| Tests fonctionnels Admin (TF-ADMN-01 a TF-ADMN-13) | `TESTS.md` §2.6 |

#### 4.5 Sprint Review & Retrospective (~2 pages)
| Contenu | Source |
|---------|--------|
| Fonctionnalites livrees + retour parties prenantes | `SPRINT_LOG.md` Sprint 2 Review |
| Retrospective | `SPRINT_LOG.md` Sprint 2 Retro |
| Burndown (26 stories, 120 SP, 2 jours) | `SPRINT_LOG.md` Sprint 2 Burndown |

---

### Chapitre 5 : Sprint 3 — Stabilisation, Pages Publiques, Integration (~12 pages)

#### 5.1 Sprint Planning (~1 page)
| Contenu | Source |
|---------|--------|
| Objectif du sprint | `SPRINT_LOG.md` Sprint 3 Planning |
| Stories + bugs selectionnes | `SPRINT_LOG.md` Sprint 3 Planning |
| Definition of Done | `SPRINT_LOG.md` Sprint 3 DoD |

#### 5.2 Analyse et Conception (~3 pages)
| Contenu | Source |
|---------|--------|
| Diagramme d'activite : Navigation complete (wiring) | `CONCEPTION.md` §8.3.1 |
| Diagramme de sequence : Seed data & demo | `CONCEPTION.md` §8.3.2 |
| Diagramme de composants (architecture 4 couches) | `CONCEPTION.md` §5 |

#### 5.3 Realisation (~5 pages)
| Contenu | Source |
|---------|--------|
| Bug fixes (14 bugs corriges, BUGF-01 a BUGF-14) | `SPRINT_LOG.md` Phase 12 |
| UX Polish (composants, pages publiques, loading skeletons) | `SPRINT_LOG.md` Phase 13 |
| Integration Wiring (navigation, notifications cablees) | `SPRINT_LOG.md` Phase 14 |
| PFE Readiness (seed data 920+ lignes, Konnect, SMS refactor) | `SPRINT_LOG.md` Phase 15 |
| **Captures d'ecran** : homepage reecrite, FAQ, Contact, CGU, loading skeletons | A capturer |

#### 5.4 Tests Sprint 3 (~1 page)
| Contenu | Source |
|---------|--------|
| Tests integration API (Konnect webhook, Resend) | `TESTS.md` §5 |
| Tests performance (temps chargement avant/apres) | `TESTS.md` §4 |

#### 5.5 Sprint Review & Retrospective (~2 pages)
| Contenu | Source |
|---------|--------|
| Fonctionnalites livrees + retour parties prenantes | `SPRINT_LOG.md` Sprint 3 Review |
| Retrospective | `SPRINT_LOG.md` Sprint 3 Retro |
| Burndown | `SPRINT_LOG.md` Sprint 3 Burndown |

---

### Chapitre 6 : Sprint 4 — IA, Performances, Securite (~15 pages)

#### 6.1 Sprint Planning (~1 page)
| Contenu | Source |
|---------|--------|
| Objectif du sprint | `SPRINT_LOG.md` Sprint 4 Planning |
| Stories selectionnees (8 stories, 39 SP) | `SPRINT_LOG.md` Sprint 4 Planning |
| Definition of Done | `SPRINT_LOG.md` Sprint 4 DoD |

#### 6.2 Analyse et Conception (~4 pages)
| Contenu | Source |
|---------|--------|
| Diagramme de cas d'utilisation : Admin & IA | `CONCEPTION.md` §8.4.1 |
| Diagramme de classes Sprint 4 (Report, Notification, ContactMessage) | `CONCEPTION.md` §8.4.5 |
| Diagramme de sequence : Chatbot IA | `CONCEPTION.md` §8.4.2 |
| Diagramme de sequence : Recommandations | `CONCEPTION.md` §8.4.3 |
| Diagramme de sequence : Gestion signalements | `CONCEPTION.md` §8.4.4 |

#### 6.3 Realisation (~7 pages)
| Contenu | Source |
|---------|--------|
| Performance (polling 15s, lazy-load, cleanup console.log) | `SPRINT_LOG.md` Phase 16 |
| Messaging images (upload, miniatures, modal plein ecran) | `SPRINT_LOG.md` Phase 17 |
| UX Safety (ConfirmDialog, dialogues deconnexion) | `SPRINT_LOG.md` Phase 18 |
| AI Features (chatbot Groq, sentiment, resumes IA, recommandations) | `SPRINT_LOG.md` Phase 19 |
| Contact & Content (formulaire contact, FAQ enrichie, CGU complete) | `SPRINT_LOG.md` Phase 20 |
| Auth Hardening (email verif atomique, OTP limites, Google OAuth, ban motif) | `SPRINT_LOG.md` Phase 21 |
| **Captures d'ecran** : chatbot widget, recommandations, analytics sentiment, images chat, confirm dialog | A capturer |

#### 6.4 Tests Sprint 4 (~2 pages)
| Contenu | Source |
|---------|--------|
| Tests securite (rate limiting, validation, headers) | `TESTS.md` §3 |
| Tests performance (metriques avant/apres optimisation) | `TESTS.md` §4 |
| Tests integration (Groq chatbot, Konnect) | `TESTS.md` §5 |

#### 6.5 Sprint Review & Retrospective (~1 page)
| Contenu | Source |
|---------|--------|
| Fonctionnalites livrees + retour parties prenantes | `SPRINT_LOG.md` Sprint 4 Review |
| Retrospective | `SPRINT_LOG.md` Sprint 4 Retro |
| Burndown | `SPRINT_LOG.md` Sprint 4 Burndown |

---

## Conclusion Generale (~3 pages)

### Bilan du Projet
| Contenu | Source |
|---------|--------|
| Objectifs atteints vs objectifs initiaux | `PRODUCT_BACKLOG_STRUCTURED.md` resume |
| Metriques finales (76 stories, 314 SP, 4 sprints, 12 jours) | `SPRINT_LOG.md` resume |
| Couverture fonctionnelle (8 themes, 100% stories v1 done) | `PRODUCT_BACKLOG_STRUCTURED.md` |
| Resultats des tests (103 tests, 100% pass) | `TESTS.md` §6 |

### Apport Personnel
| Contenu | Source |
|---------|--------|
| Competences techniques acquises (Next.js 15, Prisma, IA) | A rediger |
| Competences methodologiques (Scrum, estimation, backlog) | A rediger |
| Difficultes surmontees | `SPRINT_LOG.md` retrospectives |

### Perspectives v2
| Contenu | Source |
|---------|--------|
| Geolocalisation GPS avec Google Maps | `PRODUCT_BACKLOG_STRUCTURED.md` Backlog v2 |
| Chat temps reel WebSocket | `PRODUCT_BACKLOG_STRUCTURED.md` Backlog v2 |
| Push notifications mobile | `PRODUCT_BACKLOG_STRUCTURED.md` Backlog v2 |
| Application mobile (React Native) | `PRODUCT_BACKLOG_STRUCTURED.md` Backlog v2 |
| Interface arabe RTL complete | `PRODUCT_BACKLOG_STRUCTURED.md` Backlog v2 |
| Tests automatises (Jest, Playwright) | `TESTS.md` §6 Limitations |
| ML pour analyse sentiment | `TESTS.md` §6 Limitations |

---

## Annexes

| Annexe | Contenu | Source |
|--------|---------|--------|
| Annexe A | Schema base de donnees complet (30+ modeles) | `DATABASE_SCHEMA.md` |
| Annexe B | Reference API (17 routes) | `API_REFERENCE.md` |
| Annexe C | Tous les diagrammes UML PlantUML (31 diagrammes) | `CONCEPTION.md` |
| Annexe D | Product Backlog complet (76 stories) | `PRODUCT_BACKLOG.md` |
| Annexe E | Backlog structure (themes/epics/features) | `PRODUCT_BACKLOG_STRUCTURED.md` |
| Annexe F | Resultats de tests complets (103 tests) | `TESTS.md` |
| Annexe G | Guide de deploiement | `DEPLOYMENT.md` |

---

## Estimation de Pages

| Section | Pages Estimees |
|---------|---------------|
| Pages liminaires | 5 |
| Introduction generale | 2 |
| Chapitre 1 : Contexte | 15 |
| Chapitre 2 : Analyse des besoins | 15 |
| Chapitre 3 : Sprint 1 | 20 |
| Chapitre 4 : Sprint 2 | 20 |
| Chapitre 5 : Sprint 3 | 12 |
| Chapitre 6 : Sprint 4 | 15 |
| Conclusion | 3 |
| Annexes | 15 |
| **Total estime** | **~122 pages** |

---

## Checklist de Preparation

- [ ] Captures d'ecran de toutes les interfaces principales
- [ ] Convertir les diagrammes PlantUML en images PNG
- [ ] Rediger l'etude de l'existant (benchmarking concurrents)
- [ ] Rediger la presentation de l'organisme d'accueil
- [ ] Rediger la dedicace et les remerciements
- [ ] Compiler la liste des abreviations
- [ ] Verifier la numerotation des figures et tableaux
- [ ] Relire et harmoniser le style de redaction
- [ ] Generer la table des matieres automatiquement
- [ ] Verifier les references croisees entre chapitres