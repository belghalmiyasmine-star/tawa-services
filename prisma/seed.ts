import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { analyzeReview } from "../src/lib/ai/review-analyzer";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

// ============================================================
// HELPERS
// ============================================================

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function hoursAfter(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function minutesAfter(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60 * 1000);
}

// ============================================================
// SEED DATA CONSTANTS
// ============================================================

const PASSWORD = "Test1234!";
const SEED_DOMAIN = "@seed.tn";

// Emails to NEVER delete (real accounts)
const PROTECTED_EMAILS = [
  "admin@tawa.tn",
];

// 8 providers — all KYC APPROVED, isActive, verified
const PROVIDERS = [
  { email: "mohamed.hammami@test.tn", name: "Mohamed Hammami", display: "Mohamed Plomberie", phone: "+21620100001", bio: "Plombier certifie avec 10 ans d'experience", photoUrl: "https://randomuser.me/api/portraits/men/32.jpg", exp: 10, langs: ["Francais", "Arabe"], catSlug: "plomberie", kyc: "APPROVED" as const, featured: true, city: "Tunis", rating: 4.8, missions: 45 },
  { email: "fatma.gharbi@test.tn", name: "Fatma Gharbi", display: "Fatma Nettoyage Pro", phone: "+21620100002", bio: "Specialiste du nettoyage professionnel", photoUrl: "https://randomuser.me/api/portraits/women/44.jpg", exp: 8, langs: ["Francais", "Arabe"], catSlug: "menage-nettoyage", kyc: "APPROVED" as const, featured: true, city: "Sousse", rating: 4.6, missions: 120 },
  { email: "ahmed.khalil@test.tn", name: "Ahmed Khalil", display: "Ahmed Electricite", phone: "+21620100003", bio: "Electricien agree, interventions rapides", photoUrl: "https://randomuser.me/api/portraits/men/55.jpg", exp: 15, langs: ["Francais", "Arabe", "Anglais"], catSlug: "electricite", kyc: "APPROVED" as const, featured: true, city: "Sfax", rating: 4.9, missions: 67 },
  { email: "nour.belhadj@test.tn", name: "Nour Belhadj", display: "Nour Cours Particuliers", phone: "+21620100004", bio: "Professeure agregee de mathematiques", photoUrl: "https://randomuser.me/api/portraits/women/28.jpg", exp: 6, langs: ["Francais", "Arabe", "Anglais"], catSlug: "cours-particuliers", kyc: "APPROVED" as const, featured: false, city: "Tunis", rating: 4.7, missions: 89 },
  { email: "karim.sahli@test.tn", name: "Karim Sahli", display: "Karim Climatisation", phone: "+21620100005", bio: "Technicien frigoriste certifie", photoUrl: "https://randomuser.me/api/portraits/men/41.jpg", exp: 11, langs: ["Francais", "Arabe"], catSlug: "climatisation", kyc: "APPROVED" as const, featured: false, city: "Nabeul", rating: 4.5, missions: 34 },
  { email: "leila.mansour@test.tn", name: "Leila Mansour", display: "Leila Peinture & Deco", phone: "+21620100006", bio: "Peintre decoratrice d'interieur", photoUrl: "https://randomuser.me/api/portraits/women/65.jpg", exp: 7, langs: ["Francais", "Arabe"], catSlug: "peinture-renovation", kyc: "APPROVED" as const, featured: false, city: "Tunis", rating: 4.3, missions: 28 },
  { email: "riadh.bouslama@test.tn", name: "Riadh Bouslama", display: "Riadh Jardinage", phone: "+21620100007", bio: "Paysagiste et entretien espaces verts", photoUrl: "https://randomuser.me/api/portraits/men/22.jpg", exp: 9, langs: ["Francais", "Arabe"], catSlug: "jardinage", kyc: "APPROVED" as const, featured: false, city: "Sousse", rating: 4.4, missions: 52 },
  { email: "salma.khelifi@test.tn", name: "Salma Khelifi", display: "Salma Coiffure", phone: "+21620100008", bio: "Coiffeuse et maquilleuse professionnelle", photoUrl: "https://randomuser.me/api/portraits/women/35.jpg", exp: 5, langs: ["Francais", "Arabe"], catSlug: "coiffure", kyc: "APPROVED" as const, featured: true, city: "Tunis", rating: 4.7, missions: 95 },
];

// 4 clients — realistic Tunisian names, varied cities
const CLIENTS = [
  { email: "yasmine.client@test.tn", name: "Yasmine Ben Ali", phone: "+21623000001", city: "Tunis" },
  { email: "sami@test.tn", name: "Sami Trabelsi", phone: "+21698000002", city: "Sousse" },
  { email: "ines@test.tn", name: "Ines Mejri", phone: "+21655000003", city: "Sfax" },
  { email: "amira@test.tn", name: "Amira Chaabane", phone: "+21629000004", city: "Nabeul" },
];

// City → delegation names mapping (for assigning provider zones)
const CITY_DELEGATIONS: Record<string, string[]> = {
  "Tunis": ["Tunis Ville", "Le Bardo", "La Marsa", "Sidi Bou Said", "Carthage", "La Goulette"],
  "Ariana": ["Ariana Ville", "La Soukra", "Raoued", "Sidi Thabet", "Ettadhamen"],
  "Ben Arous": ["Ben Arous", "Hammam Lif", "Hammam Chott", "Rades", "Megrine", "Ezzahra"],
  "La Marsa": ["La Marsa", "Sidi Bou Said", "Carthage", "Tunis Ville", "Le Bardo"],
  "Sousse": ["Sousse Ville", "Sousse Jawhara", "Sousse Riadh", "Hammam Sousse", "Akouda"],
  "Sfax": ["Sfax Ville", "Sfax Ouest", "Sfax Sud", "Sakiet Ezzit", "Sakiet Eddaier"],
  "Nabeul": ["Nabeul", "Hammamet", "Kelibia", "Korba", "Dar Chaabane"],
  "Hammamet": ["Hammamet", "Nabeul", "Korba", "Grombalia", "Soliman"],
  "Monastir": ["Monastir", "Sahline", "Moknine", "Ksar Hellal", "Jemmal"],
  "Bizerte": ["Bizerte Nord", "Bizerte Sud", "Menzel Bourguiba", "Mateur"],
  "Kairouan": ["Kairouan Nord", "Kairouan Sud", "Haffouz", "Sbikha"],
  "Manouba": ["Manouba", "Den Den", "Douar Hicher", "Oued Ellil"],
};

// ============================================================
// SERVICE TEMPLATES — realistic TND prices
// ============================================================

interface ServiceTemplate {
  title: string;
  description: string;
  pricingType: "FIXED" | "SUR_DEVIS";
  fixedPrice?: number;
  durationMinutes?: number;
  categorySlug: string;
  providerIdx: number;
  photoUrls: string[];
  inclusions: string[];
  exclusions: string[];
}

const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // Mohamed (idx 0) — Plomberie
  { title: "Reparation fuite d'eau", description: "Intervention rapide pour tout type de fuite d'eau : robinet, tuyauterie, chasse d'eau. Diagnostic precis avec remplacement des pieces defectueuses et verification complete de l'etancheite.", pricingType: "FIXED", fixedPrice: 80, durationMinutes: 90, categorySlug: "reparation-fuite", providerIdx: 0, photoUrls: ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&q=80"], inclusions: ["Deplacement", "Diagnostic", "Pieces standards"], exclusions: ["Pieces speciales", "Travaux de maconnerie"] },
  { title: "Installation robinet", description: "Pose et raccordement de robinet mitigeur pour cuisine ou salle de bain. Includes la depose de l'ancien, le raccordement aux arrivees d'eau et les tests d'etancheite.", pricingType: "FIXED", fixedPrice: 120, durationMinutes: 120, categorySlug: "installation-sanitaire", providerIdx: 0, photoUrls: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80"], inclusions: ["Depose ancien", "Pose", "Test etancheite"], exclusions: ["Robinet (fourniture client)"] },
  { title: "Debouchage canalisation", description: "Debouchage professionnel de canalisations bouchees avec furet mecanique et produits adaptes. Intervention sur evier, lavabo, douche ou WC avec nettoyage complet.", pricingType: "FIXED", fixedPrice: 60, durationMinutes: 60, categorySlug: "debouchage", providerIdx: 0, photoUrls: ["https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&q=80"], inclusions: ["Deplacement", "Furet mecanique", "Produits"], exclusions: ["Camera inspection", "Remplacement tuyauterie"] },

  // Fatma (idx 1) — Ménage & Nettoyage
  { title: "Menage appartement", description: "Nettoyage complet de votre appartement : sols, sanitaires, cuisine, chambres et salon. Produits professionnels eco-responsables fournis. Resultat impeccable garanti.", pricingType: "FIXED", fixedPrice: 50, durationMinutes: 180, categorySlug: "menage-domicile", providerIdx: 1, photoUrls: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80"], inclusions: ["Produits fournis", "Toutes les pieces", "Materiel"], exclusions: ["Repassage", "Nettoyage terrasse"] },
  { title: "Nettoyage apres demenagement", description: "Nettoyage en profondeur apres un demenagement. Retrait des traces, lavage des murs, nettoyage des sols et sanitaires pour rendre le logement impeccable au nouveau locataire.", pricingType: "FIXED", fixedPrice: 150, durationMinutes: 360, categorySlug: "nettoyage-chantier", providerIdx: 1, photoUrls: ["https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&q=80"], inclusions: ["Nettoyage complet", "Produits", "Equipe de 2"], exclusions: ["Peinture", "Reparations"] },
  { title: "Repassage a domicile", description: "Service de repassage professionnel a domicile. Chemises, pantalons, robes, linge de maison. Repassage soigne avec pliage et rangement sur cintres.", pricingType: "FIXED", fixedPrice: 30, durationMinutes: 120, categorySlug: "menage-domicile", providerIdx: 1, photoUrls: ["https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=600&q=80"], inclusions: ["Jusqu'a 20 pieces", "Cintres fournis"], exclusions: ["Linge delicat", "Detachage special"] },

  // Ahmed (idx 2) — Électricité
  { title: "Installation prise electrique", description: "Pose d'une prise electrique encastree ou en saillie aux normes tunisiennes. Tirage de cable si necessaire, raccordement au tableau et verification de securite.", pricingType: "FIXED", fixedPrice: 70, durationMinutes: 60, categorySlug: "installation-electrique", providerIdx: 2, photoUrls: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80"], inclusions: ["Prise", "Cable", "Raccordement"], exclusions: ["Saignee dans mur porteur"] },
  { title: "Depannage tableau electrique", description: "Diagnostic et reparation de panne sur tableau electrique : disjoncteur defaillant, court-circuit, surcharge. Intervention rapide avec remise aux normes si necessaire.", pricingType: "FIXED", fixedPrice: 100, durationMinutes: 90, categorySlug: "depannage-electrique", providerIdx: 2, photoUrls: ["https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?w=600&q=80"], inclusions: ["Diagnostic", "Reparation", "Test securite"], exclusions: ["Remplacement tableau complet"] },
  { title: "Installation lustre", description: "Pose et branchement de lustre ou plafonnier. Fixation securisee, raccordement electrique et mise en service. Nettoyage du chantier apres intervention.", pricingType: "FIXED", fixedPrice: 90, durationMinutes: 60, categorySlug: "eclairage", providerIdx: 2, photoUrls: ["https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600&q=80"], inclusions: ["Fixation", "Branchement", "Nettoyage"], exclusions: ["Lustre (fourniture client)"] },

  // Nour (idx 3) — Cours particuliers
  { title: "Cours maths lycee", description: "Cours particuliers de mathematiques pour lycéens. Algebre, analyse, geometrie et preparation au baccalaureat. Methode structuree avec exercices corriges et suivi personnalise.", pricingType: "FIXED", fixedPrice: 40, durationMinutes: 90, categorySlug: "mathematiques", providerIdx: 3, photoUrls: ["https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=600&q=80"], inclusions: ["Support de cours", "Exercices", "Suivi WhatsApp"], exclusions: [] },
  { title: "Cours physique", description: "Cours de physique pour college et lycee. Mecanique, electricite, optique et thermodynamique. Approche pratique avec des exemples concrets pour faciliter la comprehension.", pricingType: "FIXED", fixedPrice: 40, durationMinutes: 90, categorySlug: "sciences", providerIdx: 3, photoUrls: ["https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&q=80"], inclusions: ["Cours", "Exercices", "Preparation examens"], exclusions: [] },
  { title: "Aide devoirs primaire", description: "Accompagnement scolaire pour eleves du primaire en toutes matieres. Methode ludique et bienveillante pour developper l'autonomie et la confiance de votre enfant.", pricingType: "FIXED", fixedPrice: 25, durationMinutes: 60, categorySlug: "mathematiques", providerIdx: 3, photoUrls: ["https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80"], inclusions: ["Toutes matieres", "Aide aux devoirs", "Fiches resumees"], exclusions: [] },

  // Karim (idx 4) — Climatisation
  { title: "Entretien climatiseur", description: "Maintenance complete de votre climatiseur : nettoyage filtres, verification du gaz refrigerant, controle des performances et desinfection de l'unite interieure.", pricingType: "FIXED", fixedPrice: 60, durationMinutes: 60, categorySlug: "entretien-clim", providerIdx: 4, photoUrls: ["https://images.unsplash.com/photo-1566093097221-ac2335b09e70?w=600&q=80"], inclusions: ["Nettoyage filtres", "Verification gaz", "Desinfection"], exclusions: ["Recharge gaz", "Pieces de rechange"] },
  { title: "Installation climatiseur", description: "Installation complete d'un split mural : percage, passage tuyauterie, raccordement electrique, mise sous vide et mise en service. Garantie 1 an sur l'installation.", pricingType: "FIXED", fixedPrice: 250, durationMinutes: 240, categorySlug: "installation-clim", providerIdx: 4, photoUrls: ["https://images.unsplash.com/photo-1625961332771-3f40b0e2bdcf?w=600&q=80"], inclusions: ["Installation complete", "Raccordement", "Mise en service"], exclusions: ["Climatiseur (fourniture client)", "Support specifique"] },
  { title: "Reparation climatiseur", description: "Diagnostic et reparation de climatiseur en panne : pas de froid, bruit anormal, fuite d'eau, code erreur. Intervention sur toutes les marques avec pieces d'origine.", pricingType: "FIXED", fixedPrice: 120, durationMinutes: 120, categorySlug: "reparation-clim", providerIdx: 4, photoUrls: ["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80"], inclusions: ["Diagnostic", "Main d'oeuvre", "Deplacement"], exclusions: ["Pieces de rechange", "Recharge gaz"] },

  // Leila (idx 5) — Peinture & Rénovation
  { title: "Peinture chambre", description: "Peinture complete d'une chambre jusqu'a 15m2. Preparation des murs, application d'un enduit de lissage et deux couches de peinture lavable. Couleur au choix du client.", pricingType: "FIXED", fixedPrice: 200, durationMinutes: 480, categorySlug: "peinture-interieure", providerIdx: 5, photoUrls: ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80"], inclusions: ["Preparation murs", "Enduit", "2 couches peinture"], exclusions: ["Peinture (fourniture client)", "Fissures profondes"] },
  { title: "Peinture salon", description: "Mise en peinture complete d'un salon jusqu'a 30m2. Protection du mobilier, preparation des surfaces, application de peinture decorative haute qualite avec finitions soignees.", pricingType: "FIXED", fixedPrice: 350, durationMinutes: 600, categorySlug: "peinture-interieure", providerIdx: 5, photoUrls: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80"], inclusions: ["Protection mobilier", "Preparation", "Peinture 2 couches", "Nettoyage"], exclusions: ["Peinture (fourniture client)"] },
  { title: "Ravalement facade", description: "Ravalement et peinture de facade exterieure. Nettoyage haute pression, traitement anti-humidite, application d'enduit et peinture exterieure resistante aux intemperies.", pricingType: "SUR_DEVIS", categorySlug: "peinture-exterieure", providerIdx: 5, photoUrls: ["https://images.unsplash.com/photo-1594988930347-30d449190da0?w=600&q=80"], inclusions: ["Nettoyage facade", "Traitement", "Devis gratuit"], exclusions: ["Echafaudage (si > 2 etages)"] },

  // Riadh (idx 6) — Jardinage
  { title: "Tonte pelouse", description: "Tonte de pelouse pour jardin jusqu'a 300m2. Coupe reguliere, ramassage de l'herbe et finitions aux bordures. Entretien soigne pour un gazon impeccable toute l'annee.", pricingType: "FIXED", fixedPrice: 40, durationMinutes: 120, categorySlug: "entretien-jardin", providerIdx: 6, photoUrls: ["https://images.unsplash.com/photo-1558904541-efa843a96f01?w=600&q=80"], inclusions: ["Tonte", "Ramassage herbe", "Bordures"], exclusions: ["Engrais", "Traitement pelouse"] },
  { title: "Taille haie", description: "Taille professionnelle de haies jusqu'a 20 metres lineaires. Mise en forme, nettoyage des coupes et ramassage des dechets vegetaux. Resultat net et uniforme.", pricingType: "FIXED", fixedPrice: 60, durationMinutes: 150, categorySlug: "taille-haies", providerIdx: 6, photoUrls: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80"], inclusions: ["Taille", "Mise en forme", "Nettoyage"], exclusions: ["Evacuation dechets verts", "Arbres > 4m"] },
  { title: "Amenagement jardin", description: "Conception et realisation d'amenagement paysager complet. Choix des plantes adaptees au climat tunisien, installation de systeme d'arrosage et mise en place du paillage.", pricingType: "SUR_DEVIS", categorySlug: "amenagement-paysager", providerIdx: 6, photoUrls: ["https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80"], inclusions: ["Conception", "Plan d'amenagement", "Conseil plantes"], exclusions: ["Plantes et fournitures", "Arrosage automatique"] },

  // Salma (idx 7) — Coiffure (uses menage-domicile as fallback category)
  { title: "Coupe femme", description: "Coupe de cheveux femme a domicile selon vos envies. Consultation coiffure, shampoing, coupe et coiffage. Conseils personnalises pour l'entretien au quotidien.", pricingType: "FIXED", fixedPrice: 35, durationMinutes: 60, categorySlug: "menage-domicile", providerIdx: 7, photoUrls: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80"], inclusions: ["Consultation", "Shampoing", "Coupe", "Coiffage"], exclusions: ["Coloration", "Meches"] },
  { title: "Brushing", description: "Brushing professionnel a domicile pour tous types de cheveux. Shampoing, soin demelant et mise en forme au sechoir. Resultat lisse et brillant garanti.", pricingType: "FIXED", fixedPrice: 25, durationMinutes: 45, categorySlug: "menage-domicile", providerIdx: 7, photoUrls: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80"], inclusions: ["Shampoing", "Soin", "Brushing"], exclusions: ["Lissage permanent"] },
  { title: "Maquillage mariage", description: "Maquillage professionnel pour mariee et cortege. Essai prealable inclus, produits haut de gamme longue tenue. Disponible pour les preparations du jour J a domicile.", pricingType: "FIXED", fixedPrice: 150, durationMinutes: 120, categorySlug: "menage-domicile", providerIdx: 7, photoUrls: ["https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80"], inclusions: ["Essai prealable", "Maquillage jour J", "Retouches"], exclusions: ["Coiffure (en supplement)"] },
];

// ============================================================
// MESSAGE THREADS — realistic conversations in French
// ============================================================

// Conv 1: Yasmine + Mohamed (plumbing) — 4 messages — maps to B1 (demo booking, already has conv from 3e)
// Conv 2: Sami + Fatma (cleaning) — 3 messages — maps to B2
// Conv 3: Ines + Ahmed (electrical) — 3 messages — maps to B3
// Conv 4: Amira + Salma (wedding hair) — 5 messages — maps to B8
const CONVERSATION_THREADS: {
  bookingIdx: number;
  messages: { fromClient: boolean; content: string }[];
}[] = [
  // Conv 2: Sami + Fatma — confirming cleaning schedule (B2, idx 1)
  {
    bookingIdx: 1,
    messages: [
      { fromClient: true, content: "Bonjour Fatma, je confirme pour le menage de samedi. L'appartement fait 80m2, est-ce que 50 DT c'est bon ?" },
      { fromClient: false, content: "Bonjour Sami ! Oui c'est parfait pour 80m2. Je serai la a 9h. Est-ce que vous avez des produits ou je ramene tout ?" },
      { fromClient: true, content: "Ramenez tout s'il vous plait. A samedi, merci !" },
    ],
  },
  // Conv 3: Ines + Ahmed — asking about electrical work (B3, idx 2)
  {
    bookingIdx: 2,
    messages: [
      { fromClient: true, content: "Bonjour Ahmed, le disjoncteur saute encore ce matin. C'est de pire en pire, vous pouvez venir aujourd'hui ?" },
      { fromClient: false, content: "Bonjour Ines, oui je peux passer vers 14h. En attendant, debranchez les gros appareils (four, lave-linge) pour eviter les coupures." },
      { fromClient: true, content: "D'accord, je debranche tout. Merci pour la reactivite, a tout a l'heure !" },
    ],
  },
  // Conv 4: Amira + Salma — planning wedding styling (B8, idx 7)
  {
    bookingIdx: 7,
    messages: [
      { fromClient: true, content: "Bonjour Salma ! Je vous contacte pour la coiffure de mon mariage prevu dans 3 semaines. Est-ce que vous faites aussi le maquillage ?" },
      { fromClient: false, content: "Bonjour Amira, felicitations ! Oui je fais coiffure et maquillage. On peut fixer un essai cette semaine pour voir ce qui vous plait ?" },
      { fromClient: true, content: "Oui super ! Je suis libre mercredi apres-midi. J'aimerais un chignon bas avec des fleurs et un maquillage naturel." },
      { fromClient: false, content: "Parfait, mercredi 15h chez vous ? Apportez des photos d'inspiration si vous en avez. Pour les fleurs, je travaille avec une fleuriste a Nabeul." },
      { fromClient: true, content: "Genial ! Je prepare les photos. A mercredi alors, j'ai trop hate !" },
    ],
  },
];

// ============================================================
// CATEGORIES DATA — to find existing category slugs
// ============================================================

const PARENT_CATEGORY_SLUGS = [
  "plomberie", "electricite", "menage-nettoyage", "cours-particuliers",
  "peinture-renovation", "demenagement", "jardinage", "climatisation",
  "serrurerie", "informatique-tech",
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function main() {
  console.log("========================================");
  console.log("TAWA SERVICES — COMPREHENSIVE SEED");
  console.log("========================================\n");

  // ----------------------------------------------------------
  // STEP 1: CLEAN OLD SEED DATA
  // ----------------------------------------------------------
  console.log("STEP 1: Cleaning old seed data...");

  // Find all seed users (emails ending with @seed.tn or @test.tn), excluding protected
  const seedUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: "@seed.tn" } },
        { email: { endsWith: "@test.tn" } },
      ],
      NOT: { email: { in: PROTECTED_EMAILS } },
    },
    select: { id: true, email: true },
  });

  // Also find old @tawa.tn seed users (from previous seed script), EXCEPT admin@tawa.tn
  const oldSeedUsers = await prisma.user.findMany({
    where: {
      email: { endsWith: "@tawa.tn" },
      NOT: { email: { in: PROTECTED_EMAILS } },
    },
    select: { id: true, email: true },
  });

  const allSeedUsers = [...seedUsers, ...oldSeedUsers];
  const seedUserIds = allSeedUsers.map(u => u.id);

  if (seedUserIds.length > 0) {
    console.log(`  Found ${allSeedUsers.length} seed users to clean (${seedUsers.length} @seed.tn/@test.tn + ${oldSeedUsers.length} old @tawa.tn)`);

    // Find seed providers
    const seedProviders = await prisma.provider.findMany({
      where: { userId: { in: seedUserIds } },
      select: { id: true },
    });
    const seedProviderIds = seedProviders.map(p => p.id);

    // Find bookings involving seed users (as client or via seed provider)
    const seedBookings = await prisma.booking.findMany({
      where: {
        OR: [
          { clientId: { in: seedUserIds } },
          ...(seedProviderIds.length > 0 ? [{ providerId: { in: seedProviderIds } }] : []),
        ],
      },
      select: { id: true },
    });
    const seedBookingIds = seedBookings.map(b => b.id);

    // Find conversations for those bookings
    const seedConversations = await prisma.conversation.findMany({
      where: { bookingId: { in: seedBookingIds } },
      select: { id: true },
    });
    const seedConvIds = seedConversations.map(c => c.id);

    // Delete in FK order
    if (seedConvIds.length > 0) {
      const msgDel = await prisma.message.deleteMany({ where: { conversationId: { in: seedConvIds } } });
      console.log(`  Deleted ${msgDel.count} messages`);
      const convDel = await prisma.conversation.deleteMany({ where: { id: { in: seedConvIds } } });
      console.log(`  Deleted ${convDel.count} conversations`);
    }

    const notifDel = await prisma.notification.deleteMany({ where: { userId: { in: seedUserIds } } });
    console.log(`  Deleted ${notifDel.count} notifications`);

    // Delete notification preferences
    await prisma.notificationPreference.deleteMany({ where: { userId: { in: seedUserIds } } });

    const reportDel = await prisma.report.deleteMany({
      where: { OR: [{ reporterId: { in: seedUserIds } }, { reportedId: { in: seedUserIds } }] },
    });
    console.log(`  Deleted ${reportDel.count} reports`);

    if (seedBookingIds.length > 0) {
      const revDel = await prisma.review.deleteMany({ where: { bookingId: { in: seedBookingIds } } });
      console.log(`  Deleted ${revDel.count} reviews`);

      // Delete withdrawal requests via payments
      const seedPayments = await prisma.payment.findMany({
        where: { bookingId: { in: seedBookingIds } },
        select: { id: true },
      });
      if (seedPayments.length > 0) {
        await prisma.withdrawalRequest.deleteMany({ where: { paymentId: { in: seedPayments.map(p => p.id) } } });
      }

      const payDel = await prisma.payment.deleteMany({ where: { bookingId: { in: seedBookingIds } } });
      console.log(`  Deleted ${payDel.count} payments`);

      const bookDel = await prisma.booking.deleteMany({ where: { id: { in: seedBookingIds } } });
      console.log(`  Deleted ${bookDel.count} bookings`);
    }

    // Delete quotes by seed users
    const quoteDel = await prisma.quote.deleteMany({ where: { clientId: { in: seedUserIds } } });
    console.log(`  Deleted ${quoteDel.count} quotes`);

    // Delete favorites by seed users
    await prisma.favorite.deleteMany({ where: { userId: { in: seedUserIds } } });

    // Delete services by seed providers
    if (seedProviderIds.length > 0) {
      const svcDel = await prisma.service.deleteMany({ where: { providerId: { in: seedProviderIds } } });
      console.log(`  Deleted ${svcDel.count} services`);

      // Delete provider related data
      await prisma.kYCDocument.deleteMany({ where: { providerId: { in: seedProviderIds } } });
      await prisma.trustBadge.deleteMany({ where: { providerId: { in: seedProviderIds } } });
      await prisma.availability.deleteMany({ where: { providerId: { in: seedProviderIds } } });
      await prisma.blockedDate.deleteMany({ where: { providerId: { in: seedProviderIds } } });
      await prisma.certification.deleteMany({ where: { providerId: { in: seedProviderIds } } });
      await prisma.providerDelegation.deleteMany({ where: { providerId: { in: seedProviderIds } } });
      await prisma.portfolioPhoto.deleteMany({ where: { providerId: { in: seedProviderIds } } });

      const provDel = await prisma.provider.deleteMany({ where: { id: { in: seedProviderIds } } });
      console.log(`  Deleted ${provDel.count} providers`);
    }

    // Delete auth-related records for seed users
    await prisma.emailVerification.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.passwordReset.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.loginRecord.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.account.deleteMany({ where: { userId: { in: seedUserIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: seedUserIds } } });

    const userDel = await prisma.user.deleteMany({ where: { id: { in: seedUserIds } } });
    console.log(`  Deleted ${userDel.count} users`);
  } else {
    console.log("  No old seed data found, starting fresh.");
  }

  // Clean old seed FAQs, banners, contact messages
  await prisma.faq.deleteMany({});
  await prisma.banner.deleteMany({});
  await prisma.contactMessage.deleteMany({});
  console.log("  Cleaned FAQs, banners, contact messages\n");

  // ----------------------------------------------------------
  // STEP 2: QUERY EXISTING CATEGORIES & DELEGATIONS FROM DB
  // ----------------------------------------------------------
  console.log("STEP 2: Querying existing categories & delegations...");

  // Build category slug → id map
  const allCategories = await prisma.category.findMany({
    where: { isDeleted: false },
    select: { id: true, slug: true, name: true, parentId: true },
  });
  const categoryMap: Record<string, string> = {};
  for (const cat of allCategories) {
    categoryMap[cat.slug] = cat.id;
  }
  console.log(`  Found ${allCategories.length} categories (${allCategories.filter(c => !c.parentId).length} parents)`);

  // Verify required categories exist
  const missingCats = PARENT_CATEGORY_SLUGS.filter(s => !categoryMap[s]);
  if (missingCats.length > 0) {
    console.error(`  ERROR: Missing categories: ${missingCats.join(", ")}. Run the old seed first to create categories.`);
    process.exit(1);
  }

  // Build delegation name → id map
  const allDelegations = await prisma.delegation.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true },
  });
  const delegationMap: Record<string, string> = {};
  for (const del of allDelegations) {
    delegationMap[del.name] = del.id;
  }
  console.log(`  Found ${allDelegations.length} delegations\n`);

  // ----------------------------------------------------------
  // STEP 3: CREATE SEED DATA
  // ----------------------------------------------------------
  const passwordHash = await hash(PASSWORD, 10);

  // ==================== 3.PRE: FIX ADMIN PASSWORD ====================
  // Ensure admin@tawa.tn exists and has the correct password
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@tawa.tn" } });
  if (existingAdmin) {
    await prisma.user.update({
      where: { email: "admin@tawa.tn" },
      data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
    });
    console.log("  Updated admin@tawa.tn password");
  } else {
    await prisma.user.create({
      data: {
        email: "admin@tawa.tn",
        name: "Admin Tawa",
        passwordHash,
        role: "ADMIN",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
      },
    });
    console.log("  Created admin@tawa.tn");
  }

  // ==================== 3a. CLIENTS ====================
  console.log("Creating 4 client users...");
  const clientIds: string[] = [];

  for (const c of CLIENTS) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        name: c.name,
        phone: c.phone,
        passwordHash,
        role: "CLIENT",
        emailVerified: true,
        emailVerifiedAt: daysAgo(randomInt(10, 60)),
        phoneVerified: true,
        phoneVerifiedAt: daysAgo(randomInt(10, 60)),
      },
    });
    clientIds.push(user.id);
  }
  console.log(`  -> ${clientIds.length} clients created`);

  // ==================== 3b. PROVIDERS ====================
  console.log(`Creating ${PROVIDERS.length} providers...`);
  const providerIds: string[] = [];
  const providerUserIds: string[] = [];
  const providerCategorySlugs: string[] = [];
  const providerDisplayNames: string[] = [];

  for (const p of PROVIDERS) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        name: p.name,
        phone: p.phone,
        passwordHash,
        role: "PROVIDER",
        emailVerified: true,
        emailVerifiedAt: daysAgo(randomInt(30, 90)),
        phoneVerified: true,
        phoneVerifiedAt: daysAgo(randomInt(30, 90)),
      },
    });
    providerUserIds.push(user.id);

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        displayName: p.display,
        bio: p.bio,
        photoUrl: p.photoUrl,
        phone: p.phone,
        kycStatus: p.kyc,
        kycSubmittedAt: daysAgo(randomInt(30, 60)),
        kycApprovedAt: daysAgo(randomInt(20, 50)),
        yearsExperience: p.exp,
        languages: p.langs,
        rating: p.rating,
        ratingCount: Math.round(p.missions * 0.7),
        completedMissions: p.missions,
        responseTimeHours: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
        responseRate: parseFloat((80 + Math.random() * 20).toFixed(0)),
        isFeatured: p.featured,
        isActive: true,
      },
    });
    providerIds.push(provider.id);
    providerCategorySlugs.push(p.catSlug);
    providerDisplayNames.push(p.display);

    // Assign delegations based on city
    const cityDels = CITY_DELEGATIONS[p.city] || CITY_DELEGATIONS["Tunis"]!;
    const numDels = randomInt(2, Math.min(4, cityDels.length));
    const shuffled = [...cityDels].sort(() => Math.random() - 0.5);
    for (let d = 0; d < numDels; d++) {
      const delId = delegationMap[shuffled[d]!];
      if (delId) {
        await prisma.providerDelegation.create({
          data: { providerId: provider.id, delegationId: delId },
        });
      }
    }

    // Availability (Mon-Sat, varied hours)
    for (let day = 1; day <= 6; day++) {
      const startHour = day === 6 ? "09:00" : "08:00";
      const endHour = day === 6 ? "13:00" : "18:00";
      await prisma.availability.create({
        data: { providerId: provider.id, dayOfWeek: day, startTime: startHour, endTime: endHour },
      });
    }

    // Trust badges (all providers are APPROVED)
    await prisma.trustBadge.create({
      data: { providerId: provider.id, badgeType: "IDENTITY_VERIFIED" },
    });
    if (p.featured) {
      await prisma.trustBadge.create({
        data: { providerId: provider.id, badgeType: "TOP_PROVIDER" },
      });
    }
    if (parseFloat(provider.responseTimeHours?.toString() || "3") < 1.5) {
      await prisma.trustBadge.create({
        data: { providerId: provider.id, badgeType: "QUICK_RESPONSE" },
      });
    }

    // KYC documents
    {
      for (const docType of ["CIN_RECTO", "CIN_VERSO", "SELFIE", "PROOF_OF_ADDRESS"]) {
        await prisma.kYCDocument.create({
          data: {
            providerId: provider.id,
            docType,
            fileUrl: `/uploads/kyc/${docType.toLowerCase()}_${provider.id.slice(-6)}.jpg`,
          },
        });
      }
    }

    // Blocked dates (a few random ones for some providers)
    if (Math.random() > 0.5) {
      const numBlocked = randomInt(1, 3);
      for (let b = 0; b < numBlocked; b++) {
        const blockedDate = daysFromNow(randomInt(3, 30));
        try {
          await prisma.blockedDate.create({
            data: {
              providerId: provider.id,
              date: blockedDate,
              reason: randomElement(["Conge personnel", "Rendez-vous medical", "Jour ferie"]),
            },
          });
        } catch { /* skip duplicate dates */ }
      }
    }
  }
  console.log(`  -> ${providerIds.length} providers created`);

  // ==================== 3c. SERVICES ====================
  console.log("Creating services...");
  const serviceIds: string[] = [];
  const serviceProviderMap: Record<string, number> = {}; // serviceId -> provider index

  for (let i = 0; i < SERVICE_TEMPLATES.length; i++) {
    const tmpl = SERVICE_TEMPLATES[i]!;
    const catId = categoryMap[tmpl.categorySlug];
    if (!catId) continue;

    const providerIdx = tmpl.providerIdx;
    const providerId = providerIds[providerIdx]!;
    const service = await prisma.service.create({
      data: {
        providerId,
        categoryId: catId,
        title: tmpl.title,
        description: tmpl.description,
        pricingType: tmpl.pricingType,
        fixedPrice: tmpl.fixedPrice ?? null,
        durationMinutes: tmpl.durationMinutes ?? null,
        inclusions: tmpl.inclusions,
        exclusions: tmpl.exclusions,
        photoUrls: tmpl.photoUrls,
        status: "ACTIVE",
        viewCount: randomInt(15, 250),
      },
    });
    serviceIds.push(service.id);
    serviceProviderMap[service.id] = providerIdx;
  }
  console.log(`  -> ${serviceIds.length} services created`);

  // ==================== 3d. BOOKINGS (20 bookings) ====================
  console.log("Creating 20 bookings...");
  interface BookingMeta { id: string; clientIdx: number; providerIdx: number; serviceId: string; status: string; scheduledAt: Date }
  const bookingMeta: BookingMeta[] = [];

  // Helper: find a service by provider index
  const svcByProvider = (pIdx: number) => serviceIds.find(sid => serviceProviderMap[sid] === pIdx) || serviceIds[0]!;
  // Helper: find nth service by provider index
  const svcByProviderN = (pIdx: number, n: number) => {
    const matches = serviceIds.filter(sid => serviceProviderMap[sid] === pIdx);
    return matches[n % matches.length] || serviceIds[0]!;
  };

  // Helper: create booking + optional payment, returns booking id
  async function createBooking(opts: {
    clientIdx: number; providerIdx: number; serviceId: string;
    status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    scheduledAt: Date; amount: number; createdAt: Date;
    completedAt?: Date; cancelledBy?: string; cancelReason?: string;
    clientNote?: string; providerNote?: string; quoteId?: string;
    payment?: { status: "PENDING" | "HELD" | "RELEASED" | "REFUNDED"; method: "CARD" | "D17" | "FLOUCI" | "CASH" };
  }) {
    const booking = await prisma.booking.create({
      data: {
        clientId: clientIds[opts.clientIdx]!,
        providerId: providerIds[opts.providerIdx]!,
        serviceId: opts.serviceId,
        status: opts.status,
        scheduledAt: opts.scheduledAt,
        completedAt: opts.completedAt ?? null,
        cancelledAt: opts.cancelledBy ? daysAgo(randomInt(1, 5)) : null,
        cancelledBy: opts.cancelledBy ?? null,
        cancelReason: opts.cancelReason ?? null,
        totalAmount: opts.amount,
        clientNote: opts.clientNote ?? null,
        providerNote: opts.providerNote ?? null,
        quoteId: opts.quoteId ?? null,
        createdAt: opts.createdAt,
      },
    });

    if (opts.payment) {
      const commission = parseFloat((opts.amount * 0.12).toFixed(2));
      const providerEarning = parseFloat((opts.amount - commission).toFixed(2));
      const paidAt = new Date(opts.scheduledAt.getTime() - randomInt(1, 24) * 60 * 60 * 1000);

      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          method: opts.payment.method,
          status: opts.payment.status,
          amount: opts.amount,
          commission,
          providerEarning,
          paidAt,
          heldAt: opts.payment.status !== "PENDING" ? hoursAfter(paidAt, 1) : null,
          releasedAt: opts.payment.status === "RELEASED" ? hoursAfter(opts.scheduledAt, randomInt(2, 6)) : null,
          refundedAt: opts.payment.status === "REFUNDED" ? hoursAfter(paidAt, randomInt(24, 48)) : null,
          refundAmount: opts.payment.status === "REFUNDED" ? opts.amount : null,
        },
      });
    }

    bookingMeta.push({
      id: booking.id, clientIdx: opts.clientIdx, providerIdx: opts.providerIdx,
      serviceId: opts.serviceId, status: opts.status, scheduledAt: opts.scheduledAt,
    });
    return booking.id;
  }

  // --- 5 COMPLETED bookings (past dates, payments RELEASED) ---

  // B1: Yasmine -> Mohamed (Reparation fuite 80 TND) — 45 days ago
  await createBooking({
    clientIdx: 0, providerIdx: 0, serviceId: svcByProviderN(0, 0),
    status: "COMPLETED", amount: 80, scheduledAt: daysAgo(45), createdAt: daysAgo(48),
    completedAt: daysAgo(45), clientNote: "Fuite sous l'evier de la cuisine, merci de venir avec les outils necessaires.",
    payment: { status: "RELEASED", method: "FLOUCI" },
  });

  // B2: Sami -> Fatma (Menage appartement 50 TND) — 30 days ago
  await createBooking({
    clientIdx: 1, providerIdx: 1, serviceId: svcByProviderN(1, 0),
    status: "COMPLETED", amount: 50, scheduledAt: daysAgo(30), createdAt: daysAgo(33),
    completedAt: daysAgo(30), clientNote: "Appartement S+2, produits fournis par vos soins.",
    payment: { status: "RELEASED", method: "CARD" },
  });

  // B3: Ines -> Ahmed (Depannage tableau 100 TND) — 20 days ago
  await createBooking({
    clientIdx: 2, providerIdx: 2, serviceId: svcByProviderN(2, 1),
    status: "COMPLETED", amount: 100, scheduledAt: daysAgo(20), createdAt: daysAgo(23),
    completedAt: daysAgo(20), clientNote: "Le disjoncteur saute regulierement, surtout le soir.",
    payment: { status: "RELEASED", method: "D17" },
  });

  // B4: Amira -> Nour (Cours maths 40 TND) — 15 days ago
  await createBooking({
    clientIdx: 3, providerIdx: 3, serviceId: svcByProviderN(3, 0),
    status: "COMPLETED", amount: 40, scheduledAt: daysAgo(15), createdAt: daysAgo(18),
    completedAt: daysAgo(15),
    payment: { status: "RELEASED", method: "CASH" },
  });

  // B5: Yasmine -> Karim (Entretien climatiseur 60 TND) — 10 days ago
  await createBooking({
    clientIdx: 0, providerIdx: 4, serviceId: svcByProviderN(4, 0),
    status: "COMPLETED", amount: 60, scheduledAt: daysAgo(10), createdAt: daysAgo(13),
    completedAt: daysAgo(10), clientNote: "Climatiseur Samsung dans le salon, il refroidit mal.",
    payment: { status: "RELEASED", method: "FLOUCI" },
  });

  // --- 3 ACCEPTED bookings (upcoming dates, payments HELD) ---

  // B6: Sami -> Leila (Peinture chambre 200 TND) — in 5 days
  await createBooking({
    clientIdx: 1, providerIdx: 5, serviceId: svcByProviderN(5, 0),
    status: "ACCEPTED", amount: 200, scheduledAt: daysFromNow(5), createdAt: daysAgo(3),
    clientNote: "Chambre de 12m2, couleur beige souhaitee.",
    payment: { status: "HELD", method: "CARD" },
  });

  // B7: Ines -> Riadh (Tonte pelouse 40 TND) — in 7 days
  await createBooking({
    clientIdx: 2, providerIdx: 6, serviceId: svcByProviderN(6, 0),
    status: "ACCEPTED", amount: 40, scheduledAt: daysFromNow(7), createdAt: daysAgo(2),
    payment: { status: "HELD", method: "FLOUCI" },
  });

  // B8: Amira -> Salma (Coupe femme 35 TND) — in 3 days
  await createBooking({
    clientIdx: 3, providerIdx: 7, serviceId: svcByProviderN(7, 0),
    status: "ACCEPTED", amount: 35, scheduledAt: daysFromNow(3), createdAt: daysAgo(1),
    clientNote: "Coupe mi-longue avec degrade.",
    payment: { status: "HELD", method: "D17" },
  });

  // --- 3 IN_PROGRESS bookings (current week) ---

  // B9: Yasmine -> Fatma (Nettoyage apres demenagement 150 TND) — today
  await createBooking({
    clientIdx: 0, providerIdx: 1, serviceId: svcByProviderN(1, 1),
    status: "IN_PROGRESS", amount: 150, scheduledAt: daysAgo(0), createdAt: daysAgo(4),
    clientNote: "Appartement S+3 a La Marsa, ancien locataire parti hier.",
    payment: { status: "HELD", method: "CARD" },
  });

  // B10: Sami -> Ahmed (Installation lustre 90 TND) — yesterday
  await createBooking({
    clientIdx: 1, providerIdx: 2, serviceId: svcByProviderN(2, 2),
    status: "IN_PROGRESS", amount: 90, scheduledAt: daysAgo(1), createdAt: daysAgo(5),
    clientNote: "Lustre deja achete, poids environ 8 kg.",
    payment: { status: "HELD", method: "FLOUCI" },
  });

  // B11: Amira -> Mohamed (Installation robinet 120 TND) — 2 days ago, still ongoing
  await createBooking({
    clientIdx: 3, providerIdx: 0, serviceId: svcByProviderN(0, 1),
    status: "IN_PROGRESS", amount: 120, scheduledAt: daysAgo(2), createdAt: daysAgo(6),
    providerNote: "Attente piece de rechange, intervention en 2 temps.",
    payment: { status: "HELD", method: "D17" },
  });

  // --- 2 PENDING bookings (just created, no payment yet) ---

  // B12: Ines -> Nour (Cours physique 40 TND) — in 10 days
  await createBooking({
    clientIdx: 2, providerIdx: 3, serviceId: svcByProviderN(3, 1),
    status: "PENDING", amount: 40, scheduledAt: daysFromNow(10), createdAt: daysAgo(0),
    clientNote: "Mon fils est en 2eme annee lycee, preparation bac.",
  });

  // B13: Yasmine -> Salma (Maquillage mariage 150 TND) — in 20 days
  await createBooking({
    clientIdx: 0, providerIdx: 7, serviceId: svcByProviderN(7, 2),
    status: "PENDING", amount: 150, scheduledAt: daysFromNow(20), createdAt: daysAgo(0),
    clientNote: "Mariage de ma soeur, maquillage pour la mariee et 2 demoiselles d'honneur.",
  });

  // --- 2 CANCELLED bookings ---

  // B14: Sami -> Karim (Installation climatiseur 250 TND) — cancelled by client
  await createBooking({
    clientIdx: 1, providerIdx: 4, serviceId: svcByProviderN(4, 1),
    status: "CANCELLED", amount: 250, scheduledAt: daysAgo(8), createdAt: daysAgo(15),
    cancelledBy: "CLIENT", cancelReason: "Changement de programme, le proprietaire a decide de s'en occuper lui-meme.",
    payment: { status: "REFUNDED", method: "CARD" },
  });

  // B15: Amira -> Riadh (Amenagement jardin 300 TND) — cancelled by provider
  await createBooking({
    clientIdx: 3, providerIdx: 6, serviceId: svcByProviderN(6, 2),
    status: "CANCELLED", amount: 300, scheduledAt: daysAgo(5), createdAt: daysAgo(12),
    cancelledBy: "PROVIDER", cancelReason: "Indisponibilite de l'equipe suite a un chantier prolonge sur un autre site.",
    payment: { status: "REFUNDED", method: "FLOUCI" },
  });

  // --- 2 bookings via QUOTE flow ---

  // Quote 1: Yasmine demande devis ravalement facade -> Leila repond -> COMPLETED
  const quote1 = await prisma.quote.create({
    data: {
      clientId: clientIds[0]!,
      serviceId: svcByProviderN(5, 2), // Ravalement facade (SUR_DEVIS)
      status: "ACCEPTED",
      description: "Bonjour, j'ai une facade d'environ 80m2 qui a besoin d'un ravalement complet. La peinture actuelle s'ecaille et il y a des traces d'humidite.",
      address: "12 Rue des Jasmins, La Marsa",
      city: "La Marsa",
      preferredDate: daysAgo(25),
      budget: 450,
      proposedPrice: 500,
      proposedDelay: "5 a 7 jours ouvrables",
      respondedAt: daysAgo(28),
      acceptedAt: daysAgo(27),
      expiresAt: daysAgo(20),
      createdAt: daysAgo(30),
    },
  });

  // B16: Booking from accepted quote 1
  await createBooking({
    clientIdx: 0, providerIdx: 5, serviceId: svcByProviderN(5, 2),
    status: "COMPLETED", amount: 500, scheduledAt: daysAgo(25), createdAt: daysAgo(27),
    completedAt: daysAgo(20), quoteId: quote1.id,
    clientNote: "Facade cote rue, acces par le jardin.",
    payment: { status: "RELEASED", method: "CARD" },
  });

  // Quote 2: Ines demande devis amenagement jardin -> Riadh, PENDING response
  await prisma.quote.create({
    data: {
      clientId: clientIds[2]!,
      serviceId: svcByProviderN(6, 2), // Amenagement jardin (SUR_DEVIS)
      status: "PENDING",
      description: "Je souhaite amenager mon jardin de 150m2 avec des plantes mediterraneennes et un coin detente. Besoin d'un plan complet avec systeme d'arrosage.",
      address: "45 Avenue de la Republique, Sfax",
      city: "Sfax",
      preferredDate: daysFromNow(15),
      budget: 280,
      expiresAt: daysFromNow(7),
      createdAt: daysAgo(2),
    },
  });

  // --- 3 bookings with SUR_DEVIS pricing (amount from negotiation) ---

  // B17: Sami -> Leila (Ravalement facade SUR_DEVIS -> 450 TND negocié)
  await createBooking({
    clientIdx: 1, providerIdx: 5, serviceId: svcByProviderN(5, 2),
    status: "ACCEPTED", amount: 450, scheduledAt: daysFromNow(12), createdAt: daysAgo(5),
    clientNote: "Facade arriere de la maison, environ 60m2.",
    payment: { status: "HELD", method: "CARD" },
  });

  // B18: Ines -> Riadh (Amenagement jardin SUR_DEVIS -> 320 TND negocié)
  await createBooking({
    clientIdx: 2, providerIdx: 6, serviceId: svcByProviderN(6, 2),
    status: "COMPLETED", amount: 320, scheduledAt: daysAgo(35), createdAt: daysAgo(42),
    completedAt: daysAgo(33),
    clientNote: "Petit jardin 50m2, plantes resistantes a la secheresse.",
    payment: { status: "RELEASED", method: "D17" },
  });

  // B19: Amira -> Leila (Peinture salon SUR_DEVIS -> 380 TND negocié)
  await createBooking({
    clientIdx: 3, providerIdx: 5, serviceId: svcByProviderN(5, 1),
    status: "IN_PROGRESS", amount: 380, scheduledAt: daysAgo(1), createdAt: daysAgo(7),
    clientNote: "Salon de 25m2, on veut un blanc casse sur tous les murs.",
    payment: { status: "HELD", method: "FLOUCI" },
  });

  console.log(`  -> ${bookingMeta.length} bookings created`);

  // ==================== 3e. DEMO SCENARIO (Yasmine -> Mohamed) ====================
  // The first completed booking (B1) serves as the demo scenario
  console.log("Setting up demo scenario...");
  const yasmineId = clientIds[0]!;
  const mohamedProviderIdx = 0;
  const mohamedUserId = providerUserIds[mohamedProviderIdx]!;
  const demoBookingId = bookingMeta[0]!.id;

  // Yasmine's 5-star review for Mohamed
  await prisma.review.create({
    data: {
      bookingId: demoBookingId,
      authorId: yasmineId,
      targetId: mohamedUserId,
      authorRole: "CLIENT",
      stars: 5,
      qualityRating: 5,
      punctualityRating: 5,
      communicationRating: 5,
      cleanlinessRating: 5,
      text: "Excellent travail ! Mohamed est arrive a l'heure et a repare la fuite en moins d'une heure. Tres professionnel, je recommande vivement.",
      published: true,
      publishedAt: daysAgo(44),
      sentiment: "POSITIVE",
    },
  });

  // Demo conversation
  const demoConv = await prisma.conversation.create({ data: { bookingId: demoBookingId } });
  const demoMsgs = [
    { senderId: yasmineId, content: "Bonjour Mohamed, j'ai une fuite sous l'evier de la cuisine. Est-ce que vous pouvez passer cette semaine ?" },
    { senderId: mohamedUserId, content: "Bonjour Yasmine ! Bien sur, je suis disponible demain matin. La fuite est au niveau du robinet ou sous l'evier ?" },
    { senderId: yasmineId, content: "C'est sous l'evier, ca goutte en permanence. Meme quand le robinet est ferme." },
    { senderId: mohamedUserId, content: "D'accord, c'est probablement un joint ou un raccord. Je passerai demain a 9h avec tout le necessaire." },
    { senderId: yasmineId, content: "Parfait ! Je suis a La Marsa, rue du Lac Malaren. Je vous envoie la localisation." },
    { senderId: mohamedUserId, content: "Bien recu. A demain, bonne soiree !" },
    { senderId: yasmineId, content: "Merci Mohamed, plus aucune fuite ! Excellent travail." },
    { senderId: mohamedUserId, content: "Merci Yasmine ! N'hesitez pas si vous avez besoin de quoi que ce soit. Bonne journee !" },
  ];
  for (let i = 0; i < demoMsgs.length; i++) {
    await prisma.message.create({
      data: {
        conversationId: demoConv.id,
        senderId: demoMsgs[i]!.senderId,
        content: demoMsgs[i]!.content,
        isRead: true,
        readAt: daysAgo(44 - Math.floor(i / 2)),
        createdAt: minutesAfter(daysAgo(46), i * 35),
      },
    });
  }
  console.log("  -> Demo scenario created (Yasmine -> Mohamed -> 5 stars)");

  // ==================== 3f. REVIEWS (15 total) ====================
  console.log("Creating reviews...");
  let reviewCount = 0;

  // --- 10 Positive client reviews on completed bookings ---
  // B1 (demo) already has a review from section 3e, so we use B2-B5, B16, B18 + some accepted/in-progress that were completed
  const positiveClientReviews: {
    bookingIdx: number; text: string; stars: number;
    quality: number; punctuality: number; communication: number; cleanliness: number;
  }[] = [
    // Review 1: B2 — Sami -> Fatma (Menage)
    { bookingIdx: 1, text: "Appartement impeccable, Fatma fait un travail remarquable", stars: 5, quality: 5, punctuality: 5, communication: 5, cleanliness: 5 },
    // Review 2: B3 — Ines -> Ahmed (Electricite)
    { bookingIdx: 2, text: "Installation rapide et propre, merci Ahmed!", stars: 4, quality: 4, punctuality: 4, communication: 5, cleanliness: 4 },
    // Review 3: B4 — Amira -> Nour (Cours maths)
    { bookingIdx: 3, text: "Très bon cours, ma fille a beaucoup progressé en maths", stars: 5, quality: 5, punctuality: 5, communication: 5, cleanliness: 5 },
    // Review 4: B5 — Yasmine -> Karim (Climatisation)
    { bookingIdx: 4, text: "Bon service de climatisation, Karim connaît son métier", stars: 4, quality: 4, punctuality: 4, communication: 4, cleanliness: 4 },
    // Review 5: B16 — Yasmine -> Leila (Ravalement facade)
    { bookingIdx: 15, text: "Peinture magnifique, Leila a un vrai talent", stars: 5, quality: 5, punctuality: 5, communication: 5, cleanliness: 4 },
    // Review 6: B18 — Ines -> Riadh (Amenagement jardin)
    { bookingIdx: 17, text: "Jardin transformé, Riadh est un artiste", stars: 4, quality: 5, punctuality: 4, communication: 4, cleanliness: 4 },
    // Review 7: B1 already has demo review, so use B1 for provider->client direction (handled below)
    // For the remaining 4 positive reviews, we use the same completed bookings for provider->client reviews
    // Review 7: "Bon travail dans l'ensemble, rien à redire" — assign to B2 as a 2nd perspective (provider->client)
    // Actually, we need 10 CLIENT reviews total. We only have 6 completed bookings besides demo.
    // We'll assign extra reviews to B1 (provider reviewing client) — but B1 is unique(bookingId, authorId)
    // So reviews 7-10 must go to unique booking+author combos. Let's use the demo booking for provider->client,
    // and create a few more on the completed bookings we have.
  ];

  // Create the 6 client reviews on completed bookings (B2-B5, B16, B18)
  for (const rev of positiveClientReviews) {
    const b = bookingMeta[rev.bookingIdx]!;
    await prisma.review.create({
      data: {
        bookingId: b.id,
        authorId: clientIds[b.clientIdx]!,
        targetId: providerUserIds[b.providerIdx]!,
        authorRole: "CLIENT",
        stars: rev.stars,
        qualityRating: rev.quality,
        punctualityRating: rev.punctuality,
        communicationRating: rev.communication,
        cleanlinessRating: rev.cleanliness,
        text: rev.text,
        published: true,
        publishedAt: daysAgo(randomInt(1, 20)),
        sentiment: "POSITIVE",
      },
    });
    reviewCount++;
  }

  // Reviews 7-10: Provider reviews on those same completed bookings (bidirectional)
  const providerReviewsOnCompleted: {
    bookingIdx: number; text: string; stars: number;
  }[] = [
    { bookingIdx: 1, text: "Bon travail dans l'ensemble, rien à redire", stars: 4 },
    { bookingIdx: 2, text: "Service correct et rapide", stars: 4 },
    { bookingIdx: 3, text: "Client respectueux et ponctuel, conditions ideales pour le cours", stars: 5 },
    { bookingIdx: 4, text: "Cliente agreable, logement bien prepare pour l'intervention", stars: 4 },
  ];

  for (const rev of providerReviewsOnCompleted) {
    const b = bookingMeta[rev.bookingIdx]!;
    await prisma.review.create({
      data: {
        bookingId: b.id,
        authorId: providerUserIds[b.providerIdx]!,
        targetId: clientIds[b.clientIdx]!,
        authorRole: "PROVIDER",
        stars: rev.stars,
        qualityRating: rev.stars,
        punctualityRating: Math.max(3, rev.stars - randomInt(0, 1)),
        communicationRating: rev.stars,
        cleanlinessRating: rev.stars,
        text: rev.text,
        published: true,
        publishedAt: daysAgo(randomInt(1, 18)),
        sentiment: "POSITIVE",
      },
    });
    reviewCount++;
  }

  console.log(`  -> ${reviewCount} positive reviews created (10 total: 6 client + 4 provider)`);

  // --- 3 Mixed/Negative client reviews ---
  const mixedNegativeReviews: {
    bookingIdx: number; text: string; stars: number;
  }[] = [
    // B16 provider->client direction (Leila reviewing Yasmine) — 3 stars
    { bookingIdx: 15, text: "Travail correct mais arrivé en retard de 30 minutes", stars: 3 },
    // B18 provider->client direction (Riadh reviewing Ines) — 3 stars
    { bookingIdx: 17, text: "Le résultat est moyen, je m'attendais à mieux pour le prix", stars: 3 },
    // B6 provider->client direction (Leila reviewing Sami) — 2 stars
    { bookingIdx: 5, text: "Pas terrible, travail bâclé et attitude désagréable", stars: 2 },
  ];

  for (const rev of mixedNegativeReviews) {
    const b = bookingMeta[rev.bookingIdx]!;
    const analysis = analyzeReview(rev.text, rev.stars);
    const review = await prisma.review.create({
      data: {
        bookingId: b.id,
        authorId: providerUserIds[b.providerIdx]!,
        targetId: clientIds[b.clientIdx]!,
        authorRole: "PROVIDER",
        stars: rev.stars,
        qualityRating: rev.stars,
        punctualityRating: Math.max(1, rev.stars - randomInt(0, 1)),
        communicationRating: rev.stars,
        cleanlinessRating: Math.max(1, rev.stars + randomInt(-1, 0)),
        text: rev.text,
        published: true,
        publishedAt: daysAgo(randomInt(1, 15)),
        sentiment: analysis.sentiment,
        flagged: analysis.flagged,
        flaggedReason: analysis.flagged ? analysis.reasons.join(", ") : null,
      },
    });

    if (analysis.flagged && analysis.severity) {
      const slaHoursMap = { CRITICAL: 2, IMPORTANT: 24, MINOR: 48 };
      const slaHours = slaHoursMap[analysis.severity];
      await prisma.report.create({
        data: {
          reporterId: providerUserIds[b.providerIdx]!,
          reportedId: clientIds[b.clientIdx]!,
          type: "REVIEW",
          reason: analysis.reasons.join(", "),
          description: `Auto-signalement IA: ${analysis.reasons.join(", ")}. Sentiment: ${analysis.sentiment}. Severite: ${analysis.severity}.`,
          priority: analysis.severity,
          status: "OPEN",
          referenceId: review.id,
          slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
        },
      });
      console.log(`    -> Auto-report created for review (severity: ${analysis.severity})`);
    }
    reviewCount++;
  }
  console.log(`  -> 3 mixed/negative reviews created`);

  // --- 2 Flagged reviews for testing auto-report ---
  // These use completed bookings that don't yet have a provider->client review in this direction
  const flaggedReviews: {
    bookingIdx: number; text: string; stars: number;
    expectedFlag: string;
  }[] = [
    // Client review on B18 (Ines->Riadh already has client review, so use B5 client->provider 2nd review is not possible — unique constraint)
    // Use B16 for a NEW client reviewing — but Yasmine already reviewed B16 as client.
    // We need bookings without a client review yet. B1 demo has one. B2-B5, B16, B18 have client reviews.
    // No completed bookings left without client reviews. So we add these as provider reviews on B1 (demo) and B5.
    // B1: Mohamed (provider) reviewing Yasmine (client) — flagged IMPORTANT (insults)
    { bookingIdx: 0, text: "Service nul, c'est une arnaque complète, ce prestataire est un escroc", stars: 1, expectedFlag: "IMPORTANT" },
    // B5: Yasmine already got a provider review from Karim above (2 stars). Need another booking.
    // B18: Ines->Riadh. Riadh already reviewed Ines above (3 stars mixed).
    // Let's use B16: Leila already reviewed Yasmine above (3 stars mixed).
    // Remaining: B2 has provider review (4 stars). B3 has provider review (4 stars). B4 has provider review (5 stars).
    // We need a unique bookingId+authorId. The only completed booking provider->client combos NOT yet used:
    // B1: Mohamed->Yasmine (not yet), B5: Karim->Yasmine (used above), B16: Leila->Yasmine (used above), B18: Riadh->Ines (used above)
    // So B1 Mohamed->Yasmine is available for the 1-star flagged.
    // For the 2nd flagged, we need another booking. All completed provider->client slots are taken except B1.
    // Let's make the 2nd flagged a CLIENT review on a booking that has no client review yet... but all completed bookings have client reviews.
    // Alternative: make it a client review replacing an existing one? No, unique constraint.
    // Best option: create it as a client->provider on an ACCEPTED booking that got completed early or just accept we need it on a non-completed booking.
    // Actually re-checking: B18 has client review (Ines->Riadh "Jardin transformé"). Provider review is "Le résultat est moyen" above.
    // B1 has client demo review (Yasmine->Mohamed). No provider review yet. Let's use B1 for BOTH flagged reviews:
    // B1 provider->client (Mohamed->Yasmine) for the 1-star insult flagged.
    // For the 2nd one, we need a different booking. Let's use it as a CLIENT review on a booking without one.
    // Hmm, all 7 completed bookings have client reviews.
    // Simplest: add the 2nd flagged review as provider->client on B5 — wait, B5 already has Karim->Yasmine (2 stars) above.
    // OK so truly the only open slot is B1 provider->client.
    // Let's just use B1 for the insult one, and for the contact-info one, create it on a non-review booking or just skip the constraint.
    // Actually, I realize I should check: is the unique constraint bookingId+authorId? Yes: @@unique([bookingId, authorId])
    // Remaining open (bookingId, authorId) on completed bookings:
    // B1: (bookingId, mohamedUserId) — open ✓
    // B16: (bookingId, leilaUserId) — used above (3 stars mixed)
    // B18: (bookingId, riadhUserId) — used above (3 stars mixed)
    // B5: (bookingId, karimUserId) — used above (2 stars mixed)
    // So only B1 provider->client is open. We only have 1 slot.
    // For the 2nd flagged review: let's just add a client review on an ACCEPTED booking. It's seed data, it's fine.
    // Use B6 (Sami->Leila, ACCEPTED) or B7 (Ines->Riadh, ACCEPTED)
    { bookingIdx: 5, text: "Travail acceptable mais contact info: appelez-moi au 55123456", stars: 3, expectedFlag: "MINOR" },
  ];

  // Flagged review 1: B1 — Mohamed (provider) reviews Yasmine (client) — insult keywords
  {
    const b = bookingMeta[0]!; // B1 demo booking
    const text = flaggedReviews[0]!.text;
    const stars = flaggedReviews[0]!.stars;
    const analysis = analyzeReview(text, stars);
    const review = await prisma.review.create({
      data: {
        bookingId: b.id,
        authorId: providerUserIds[b.providerIdx]!,
        targetId: clientIds[b.clientIdx]!,
        authorRole: "PROVIDER",
        stars,
        qualityRating: 1,
        punctualityRating: 1,
        communicationRating: 1,
        cleanlinessRating: 1,
        text,
        published: false, // flagged reviews not published
        sentiment: analysis.sentiment,
        flagged: analysis.flagged,
        flaggedReason: analysis.flagged ? analysis.reasons.join(", ") : null,
      },
    });

    if (analysis.flagged && analysis.severity) {
      const slaHoursMap = { CRITICAL: 2, IMPORTANT: 24, MINOR: 48 };
      const slaHours = slaHoursMap[analysis.severity];
      await prisma.report.create({
        data: {
          reporterId: providerUserIds[b.providerIdx]!,
          reportedId: clientIds[b.clientIdx]!,
          type: "REVIEW",
          reason: analysis.reasons.join(", "),
          description: `Auto-signalement IA: ${analysis.reasons.join(", ")}. Sentiment: ${analysis.sentiment}. Severite: ${analysis.severity}.`,
          priority: analysis.severity,
          status: "OPEN",
          referenceId: review.id,
          slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
        },
      });
      console.log(`    -> Auto-report created: "${text.slice(0, 40)}..." => ${analysis.severity} (reasons: ${analysis.reasons.join(", ")})`);
    }
    reviewCount++;
  }

  // Flagged review 2: B6 — Sami (client) reviews Leila (provider) — contact info
  {
    const b = bookingMeta[5]!; // B6 (ACCEPTED booking)
    const text = flaggedReviews[1]!.text;
    const stars = flaggedReviews[1]!.stars;
    const analysis = analyzeReview(text, stars);
    const review = await prisma.review.create({
      data: {
        bookingId: b.id,
        authorId: clientIds[b.clientIdx]!,
        targetId: providerUserIds[b.providerIdx]!,
        authorRole: "CLIENT",
        stars,
        qualityRating: 3,
        punctualityRating: 3,
        communicationRating: 3,
        cleanlinessRating: 3,
        text,
        published: false, // flagged reviews not published
        sentiment: analysis.sentiment,
        flagged: analysis.flagged,
        flaggedReason: analysis.flagged ? analysis.reasons.join(", ") : null,
      },
    });

    if (analysis.flagged && analysis.severity) {
      const slaHoursMap = { CRITICAL: 2, IMPORTANT: 24, MINOR: 48 };
      const slaHours = slaHoursMap[analysis.severity];
      await prisma.report.create({
        data: {
          reporterId: clientIds[b.clientIdx]!,
          reportedId: providerUserIds[b.providerIdx]!,
          type: "REVIEW",
          reason: analysis.reasons.join(", "),
          description: `Auto-signalement IA: ${analysis.reasons.join(", ")}. Sentiment: ${analysis.sentiment}. Severite: ${analysis.severity}.`,
          priority: analysis.severity,
          status: "OPEN",
          referenceId: review.id,
          slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
        },
      });
      console.log(`    -> Auto-report created: "${text.slice(0, 40)}..." => ${analysis.severity} (reasons: ${analysis.reasons.join(", ")})`);
    }
    reviewCount++;
  }

  console.log(`  -> 2 flagged reviews created with auto-reports`);
  console.log(`  -> TOTAL: ${reviewCount + 1} reviews (incl. demo)`);

  // ==================== 3g. CONVERSATIONS & MESSAGES (4 conversations) ====================
  // Conv 1 (Yasmine + Mohamed) is already created in section 3e (demo scenario) with 8 messages.
  // Here we create Conv 2-4 from CONVERSATION_THREADS.
  console.log("Creating 3 additional conversations (Conv 2-4)...");
  let messageCount = 0;
  let convCount = 1; // demo conv already counts as 1

  for (const thread of CONVERSATION_THREADS) {
    const b = bookingMeta[thread.bookingIdx]!;

    try {
      const conversation = await prisma.conversation.create({ data: { bookingId: b.id } });
      // Spread messages over the booking period
      const baseTime = new Date(b.scheduledAt.getTime() - thread.messages.length * 45 * 60 * 1000);

      for (let j = 0; j < thread.messages.length; j++) {
        const msg = thread.messages[j]!;
        const senderId = msg.fromClient ? clientIds[b.clientIdx]! : providerUserIds[b.providerIdx]!;
        const msgTime = minutesAfter(baseTime, j * randomInt(30, 90));

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            content: msg.content,
            isRead: j < thread.messages.length - 1,
            readAt: j < thread.messages.length - 1 ? minutesAfter(msgTime, randomInt(5, 30)) : null,
            createdAt: msgTime,
          },
        });
        messageCount++;
      }
      convCount++;
    } catch { /* skip if conversation already exists for this booking */ }
  }
  console.log(`  -> ${messageCount} messages in ${convCount - 1} new conversations (${convCount} total incl. demo)`);

  // ==================== 3h. NOTIFICATIONS (6 total) ====================
  console.log("Creating 6 notifications...");

  const notifTemplates: { userId: string; type: "BOOKING_REQUEST" | "BOOKING_ACCEPTED" | "BOOKING_COMPLETED" | "PAYMENT_RECEIVED" | "REVIEW_RECEIVED" | "NEW_MESSAGE"; title: string; body: string; read: boolean; createdAt: Date }[] = [
    // 1. Yasmine — booking accepted by Mohamed
    { userId: clientIds[0]!, type: "BOOKING_ACCEPTED", title: "Reservation acceptee", body: `${PROVIDERS[0]!.display} a accepte votre reservation pour la reparation de fuite.`, read: true, createdAt: daysAgo(46) },
    // 2. Mohamed — new review received (5 stars from Yasmine)
    { userId: providerUserIds[0]!, type: "REVIEW_RECEIVED", title: "Nouvel avis", body: `${CLIENTS[0]!.name} vous a donne 5 etoiles ! Bravo !`, read: true, createdAt: daysAgo(44) },
    // 3. Sami — new message from Fatma about cleaning
    { userId: clientIds[1]!, type: "NEW_MESSAGE", title: "Nouveau message", body: `${PROVIDERS[1]!.display} vous a envoye un message concernant votre reservation de menage.`, read: false, createdAt: daysAgo(2) },
    // 4. Ahmed — payment received for electrical work
    { userId: providerUserIds[2]!, type: "PAYMENT_RECEIVED", title: "Paiement recu", body: "88.00 TND ont ete credites sur votre compte Tawa (apres commission 12%).", read: false, createdAt: daysAgo(20) },
    // 5. Amira — booking completed with Nour (cours maths)
    { userId: clientIds[3]!, type: "BOOKING_COMPLETED", title: "Service termine", body: `Votre cours avec ${PROVIDERS[3]!.display} est termine. N'oubliez pas de laisser un avis !`, read: true, createdAt: daysAgo(15) },
    // 6. Ines — booking request from provider Ahmed accepted
    { userId: clientIds[2]!, type: "BOOKING_ACCEPTED", title: "Reservation acceptee", body: `${PROVIDERS[2]!.display} interviendra pour le depannage electrique.`, read: true, createdAt: daysAgo(22) },
  ];

  for (const notif of notifTemplates) {
    await prisma.notification.create({
      data: {
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        read: notif.read,
        readAt: notif.read ? hoursAfter(notif.createdAt, randomInt(1, 12)) : null,
        createdAt: notif.createdAt,
      },
    });
  }
  console.log(`  -> ${notifTemplates.length} notifications created`);

  // Quotes already created inline with bookings (2 quotes in section 3d)
  console.log("  -> 2 quotes created (inline with bookings)");

  // ==================== 3j. REPORTS ====================
  console.log("Creating reports...");

  const reports = [
    {
      reporterId: clientIds[3]!,
      reportedId: providerUserIds[1]!,
      type: "USER" as const,
      reason: "Prestataire ne s'est pas presente au rendez-vous",
      description: "J'avais reserve un service de plomberie pour 10h. Le prestataire n'est jamais venu et n'a pas repondu aux messages pendant 3 heures.",
      priority: "IMPORTANT" as const,
      status: "OPEN" as const,
      slaDeadline: daysFromNow(1),
    },
    {
      reporterId: clientIds[1]!,
      type: "SERVICE" as const,
      reason: "Description trompeuse du service",
      description: "Le tarif affiche ne correspond pas au prix demande lors de l'intervention. 45 DT annonces sur la plateforme, 120 DT factures sur place sans explication.",
      priority: "MINOR" as const,
      status: "INVESTIGATING" as const,
    },
    {
      reporterId: providerUserIds[2]!,
      reportedId: clientIds[3]!,
      type: "USER" as const,
      reason: "Client irrespectueux",
      description: "Le client a ete tres impoli et agressif pendant l'intervention. Environnement de travail hostile. A crie sans raison.",
      priority: "MINOR" as const,
      status: "OPEN" as const,
    },
    {
      reporterId: clientIds[2]!,
      type: "REVIEW" as const,
      reason: "Avis potentiellement faux",
      description: "Cet avis 5 etoiles semble ecrit par le prestataire lui-meme. Le style d'ecriture et les details sont suspects.",
      priority: "MINOR" as const,
      status: "OPEN" as const,
    },
    {
      reporterId: clientIds[0]!,
      reportedId: providerUserIds[3]!,
      type: "USER" as const,
      reason: "Demande de paiement en dehors de la plateforme",
      description: "Le prestataire m'a demande de payer directement en especes pour eviter la commission Tawa. C'est contraire aux conditions.",
      priority: "CRITICAL" as const,
      status: "OPEN" as const,
      slaDeadline: hoursAfter(new Date(), 2),
    },
  ];

  for (const r of reports) {
    await prisma.report.create({ data: r });
  }
  console.log(`  -> ${reports.length} reports created`);

  // ==================== 3k. FAVORITES ====================
  console.log("Creating favorites...");
  let favCount = 0;
  for (let i = 0; i < 15; i++) {
    const clientIdx = i % clientIds.length;
    const serviceId = serviceIds[randomInt(0, serviceIds.length - 1)]!;
    try {
      await prisma.favorite.create({
        data: { userId: clientIds[clientIdx]!, serviceId },
      });
      favCount++;
    } catch { /* skip duplicate */ }
  }
  console.log(`  -> ${favCount} favorites created`);

  // ==================== 3l. FAQs ====================
  console.log("Creating FAQs...");
  const faqs = [
    { question: "Comment fonctionne Tawa Services ?", answer: "Tawa Services met en relation des clients avec des prestataires de services verifies en Tunisie. Recherchez un service, comparez les profils, reservez en ligne et payez en toute securite via notre systeme d'escrow.", category: "general", sortOrder: 0 },
    { question: "L'inscription est-elle gratuite ?", answer: "Oui, l'inscription est entierement gratuite pour les clients et les prestataires. Seule une commission de 12% est prelevee sur chaque transaction realisee.", category: "general", sortOrder: 1 },
    { question: "Comment devenir prestataire ?", answer: "Inscrivez-vous en tant que prestataire, completez votre profil professionnel, soumettez vos documents KYC (CIN recto/verso, selfie, justificatif de domicile) et attendez la validation de notre equipe. Une fois approuve, vous pouvez publier vos services.", category: "provider", sortOrder: 2 },
    { question: "Quels sont les moyens de paiement acceptes ?", answer: "Nous acceptons les paiements par carte bancaire, D17 (Poste tunisienne), Flouci et especes. Le paiement est securise via notre systeme d'escrow : l'argent est retenu jusqu'a la completion du service.", category: "payment", sortOrder: 3 },
    { question: "Quelle est la commission Tawa ?", answer: "Tawa preleve une commission de 12% sur chaque transaction terminee. Ce montant couvre les frais de plateforme, la mise en relation, le support client et la garantie de service.", category: "payment", sortOrder: 4 },
    { question: "Comment annuler une reservation ?", answer: "Vous pouvez annuler une reservation depuis votre espace 'Mes reservations'. Remboursement integral si l'annulation est faite plus de 48h avant le rendez-vous, 50% entre 24h et 48h, pas de remboursement en dessous de 24h.", category: "booking", sortOrder: 5 },
    { question: "Comment laisser un avis ?", answer: "Apres chaque prestation terminee, vous avez 10 jours pour laisser un avis. Les avis sont publies simultanement une fois que les deux parties (client et prestataire) ont donne leur evaluation.", category: "general", sortOrder: 6 },
    { question: "Quand le prestataire recoit-il son paiement ?", answer: "Le paiement est libere au prestataire des que le service est marque comme termine. La commission de 12% est automatiquement deduite. Le prestataire peut ensuite demander un virement.", category: "payment", sortOrder: 7 },
    { question: "Que faire en cas de probleme avec un prestataire ?", answer: "Utilisez le bouton 'Signaler' sur le profil du prestataire ou contactez-nous via la page Contact. Les signalements critiques sont traites sous 2 heures, les importants sous 24 heures.", category: "general", sortOrder: 8 },
    { question: "Comment modifier mon profil prestataire ?", answer: "Connectez-vous a votre espace prestataire, allez dans 'Mon profil' et modifiez vos informations : bio, photo, zones d'intervention, disponibilites, langues parlees.", category: "provider", sortOrder: 9 },
  ];
  for (const faq of faqs) {
    await prisma.faq.create({ data: faq });
  }
  console.log(`  -> ${faqs.length} FAQs created`);

  // ==================== 3m. LEGAL PAGES ====================
  console.log("Creating legal pages...");
  await prisma.legalPage.upsert({
    where: { slug: "cgu" },
    update: {},
    create: {
      slug: "cgu",
      title: "Conditions Generales d'Utilisation",
      content: "Les presentes Conditions Generales d'Utilisation regissent l'utilisation de la plateforme Tawa Services. En utilisant nos services, vous acceptez ces conditions dans leur integralite. Tawa Services est une plateforme de mise en relation entre clients et prestataires de services en Tunisie.",
    },
  });
  await prisma.legalPage.upsert({
    where: { slug: "privacy" },
    update: {},
    create: {
      slug: "privacy",
      title: "Politique de Confidentialite",
      content: "Tawa Services s'engage a proteger vos donnees personnelles conformement a la legislation tunisienne en vigueur (Loi organique n°2004-63). Cette politique explique comment nous collectons, utilisons et protegeons vos informations personnelles.",
    },
  });
  console.log("  -> Legal pages created");

  // ==================== 3n. BANNERS ====================
  console.log("Creating banners...");
  await prisma.banner.create({
    data: {
      title: "Bienvenue sur Tawa Services !",
      subtitle: "Trouvez le bon prestataire pres de chez vous en quelques clics. Plus de 50 services disponibles.",
      position: "homepage",
      isActive: true,
      sortOrder: 0,
    },
  });
  await prisma.banner.create({
    data: {
      title: "Devenez prestataire",
      subtitle: "Rejoignez plus de 100 prestataires verifies et developpez votre activite.",
      position: "homepage",
      isActive: true,
      sortOrder: 1,
    },
  });
  console.log("  -> 2 banners created");

  // ==================== 3o. CONTACT MESSAGES ====================
  console.log("Creating sample contact messages...");
  const contactMsgs = [
    { name: "Samir Ben Ali", email: "samir.benali@gmail.com", subject: "Question sur les tarifs", message: "Bonjour, je souhaite savoir si les tarifs affiches sont TTC ou HT. Merci de votre reponse." },
    { name: "Amina Sfaxi", email: "amina.sfaxi@yahoo.fr", subject: "Probleme de paiement", message: "J'ai effectue un paiement par carte mais la reservation n'a pas ete confirmee. Mon numero de carte a ete debite. Pouvez-vous verifier svp ?" },
    { name: "Tarek Hammami", email: "tarek.h@gmail.com", subject: "Partenariat commercial", message: "Je suis responsable d'une entreprise de nettoyage et j'aimerais discuter d'un partenariat avec Tawa Services. Pouvons-nous organiser un rendez-vous ?" },
  ];
  for (const msg of contactMsgs) {
    await prisma.contactMessage.create({
      data: { ...msg, createdAt: randomDate(daysAgo(15), new Date()) },
    });
  }
  console.log(`  -> ${contactMsgs.length} contact messages created`);

  // ----------------------------------------------------------
  // STEP 10: SUMMARY
  // ----------------------------------------------------------
  const totalMessages = messageCount + 8; // +8 from demo conv in section 3e
  const totalReviews = reviewCount + 1;   // +1 demo review from section 3e
  const totalReports = reports.length;     // manual reports (auto-reports from flagged reviews logged separately)

  console.log("\n========================================");
  console.log("SEED COMPLETE!");
  console.log("========================================");
  console.log(`Clients:       ${CLIENTS.length} users`);
  console.log(`Providers:     ${PROVIDERS.length} users`);
  console.log(`Services:      ${serviceIds.length}`);
  console.log(`Bookings:      ${bookingMeta.length}`);
  console.log(`Reviews:       ${totalReviews} (10 positive + 3 mixed/negative + 2 flagged + 1 demo)`);
  console.log(`Conversations: ${convCount} (1 demo + ${convCount - 1} new)`);
  console.log(`Messages:      ${totalMessages}`);
  console.log(`Notifications: ${notifTemplates.length}`);
  console.log(`Quotes:        2`);
  console.log(`Reports:       ${totalReports} manual + auto-reports from flagged reviews`);
  console.log(`Favorites:     ${favCount}`);
  console.log(`FAQs:          ${faqs.length}`);
  console.log(`Contacts:      ${contactMsgs.length}`);
  console.log(`Banners:       2`);
  console.log("========================================");
  console.log("\nDemo accounts:");
  console.log(`  Admin:    admin@tawa.tn / ${PASSWORD}`);
  console.log(`  Client:   ${CLIENTS[0]!.email} / ${PASSWORD}`);
  console.log(`  Provider: ${PROVIDERS[0]!.email} / ${PASSWORD}`);
  console.log("\nConversations:");
  console.log("  Conv 1: Yasmine + Mohamed (plumbing) — 8 msgs");
  console.log("  Conv 2: Sami + Fatma (cleaning) — 3 msgs");
  console.log("  Conv 3: Ines + Ahmed (electrical) — 3 msgs");
  console.log("  Conv 4: Amira + Salma (wedding hair) — 5 msgs");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error("SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
