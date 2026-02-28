import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"] });
const prisma = new PrismaClient({ adapter });

// ============================================================
// TUNISIAN GOUVERNORATS & DELEGATIONS
// ============================================================

const GOUVERNORATS_DATA: { name: string; code: string; delegations: string[] }[] = [
  {
    name: "Tunis",
    code: "TUN",
    delegations: [
      "Tunis Ville", "Le Bardo", "La Marsa", "Sidi Bou Said",
      "Carthage", "La Goulette", "Le Kram", "Sidi Hassine",
    ],
  },
  {
    name: "Ariana",
    code: "ARI",
    delegations: [
      "Ariana Ville", "La Soukra", "Raoued", "Sidi Thabet",
      "Ettadhamen", "Mnihla", "Kalaat el-Andalous",
    ],
  },
  {
    name: "Ben Arous",
    code: "BNA",
    delegations: [
      "Ben Arous", "Hammam Lif", "Hammam Chott", "Rades",
      "Megrine", "Mohamedia", "Fouchana", "Ezzahra", "Mornag",
    ],
  },
  {
    name: "Manouba",
    code: "MAN",
    delegations: [
      "Manouba", "Den Den", "Douar Hicher", "Oued Ellil",
      "Tebourba", "El Battan", "Borj El Amri",
    ],
  },
  {
    name: "Nabeul",
    code: "NAB",
    delegations: [
      "Nabeul", "Hammamet", "Kelibia", "Korba",
      "Dar Chaabane", "Grombalia", "Soliman", "Menzel Temime",
    ],
  },
  {
    name: "Sousse",
    code: "SOU",
    delegations: [
      "Sousse Ville", "Sousse Jawhara", "Sousse Riadh", "Hammam Sousse",
      "Akouda", "Kalaa Kebira", "Msaken", "Enfida",
    ],
  },
  {
    name: "Sfax",
    code: "SFA",
    delegations: [
      "Sfax Ville", "Sfax Ouest", "Sfax Sud", "Sakiet Ezzit",
      "Sakiet Eddaier", "Thyna", "El Ain", "Mahres",
    ],
  },
  {
    name: "Bizerte",
    code: "BIZ",
    delegations: [
      "Bizerte Nord", "Bizerte Sud", "Menzel Bourguiba",
      "Mateur", "Ras Jebel", "Sejnane",
    ],
  },
  {
    name: "Gabes",
    code: "GAB",
    delegations: [
      "Gabes Ville", "Gabes Medina", "Gabes Ouest", "Gabes Sud",
      "El Hamma", "Mareth", "Matmata",
    ],
  },
  {
    name: "Kairouan",
    code: "KAI",
    delegations: [
      "Kairouan Nord", "Kairouan Sud", "Haffouz",
      "Sbikha", "Nasrallah", "Chebika",
    ],
  },
  {
    name: "Monastir",
    code: "MON",
    delegations: [
      "Monastir", "Sahline", "Moknine", "Ksar Hellal",
      "Jemmal", "Beni Hassen", "Teboulba",
    ],
  },
  {
    name: "Medenine",
    code: "MED",
    delegations: [
      "Medenine Nord", "Medenine Sud", "Zarzis",
      "Ben Guerdane", "Djerba Houmt Souk", "Djerba Midoun",
    ],
  },
];

// ============================================================
// SERVICE CATEGORIES (parent + children)
// ============================================================

const CATEGORIES_DATA: { name: string; slug: string; icon: string; children: { name: string; slug: string }[] }[] = [
  {
    name: "Plomberie",
    slug: "plomberie",
    icon: "Wrench",
    children: [
      { name: "Reparation fuite", slug: "reparation-fuite" },
      { name: "Installation sanitaire", slug: "installation-sanitaire" },
      { name: "Debouchage", slug: "debouchage" },
    ],
  },
  {
    name: "Electricite",
    slug: "electricite",
    icon: "Zap",
    children: [
      { name: "Installation electrique", slug: "installation-electrique" },
      { name: "Depannage electrique", slug: "depannage-electrique" },
      { name: "Eclairage", slug: "eclairage" },
    ],
  },
  {
    name: "Menage & Nettoyage",
    slug: "menage-nettoyage",
    icon: "Sparkles",
    children: [
      { name: "Menage a domicile", slug: "menage-domicile" },
      { name: "Nettoyage fin de chantier", slug: "nettoyage-chantier" },
      { name: "Nettoyage vitres", slug: "nettoyage-vitres" },
    ],
  },
  {
    name: "Cours particuliers",
    slug: "cours-particuliers",
    icon: "GraduationCap",
    children: [
      { name: "Mathematiques", slug: "mathematiques" },
      { name: "Langues", slug: "langues" },
      { name: "Informatique", slug: "informatique" },
      { name: "Sciences", slug: "sciences" },
    ],
  },
  {
    name: "Peinture & Renovation",
    slug: "peinture-renovation",
    icon: "PaintBucket",
    children: [
      { name: "Peinture interieure", slug: "peinture-interieure" },
      { name: "Peinture exterieure", slug: "peinture-exterieure" },
      { name: "Renovation generale", slug: "renovation-generale" },
    ],
  },
  {
    name: "Demenagement",
    slug: "demenagement",
    icon: "Truck",
    children: [
      { name: "Demenagement local", slug: "demenagement-local" },
      { name: "Transport de meubles", slug: "transport-meubles" },
    ],
  },
  {
    name: "Jardinage",
    slug: "jardinage",
    icon: "TreePine",
    children: [
      { name: "Entretien jardin", slug: "entretien-jardin" },
      { name: "Taille de haies", slug: "taille-haies" },
      { name: "Amenagement paysager", slug: "amenagement-paysager" },
    ],
  },
  {
    name: "Climatisation",
    slug: "climatisation",
    icon: "Snowflake",
    children: [
      { name: "Installation climatisation", slug: "installation-clim" },
      { name: "Entretien climatisation", slug: "entretien-clim" },
      { name: "Reparation climatisation", slug: "reparation-clim" },
    ],
  },
  {
    name: "Serrurerie",
    slug: "serrurerie",
    icon: "KeyRound",
    children: [
      { name: "Ouverture de porte", slug: "ouverture-porte" },
      { name: "Changement de serrure", slug: "changement-serrure" },
    ],
  },
  {
    name: "Informatique & Tech",
    slug: "informatique-tech",
    icon: "Monitor",
    children: [
      { name: "Reparation PC/Mac", slug: "reparation-pc" },
      { name: "Installation reseau", slug: "installation-reseau" },
      { name: "Assistance informatique", slug: "assistance-informatique" },
    ],
  },
];

// ============================================================
// DEMO USERS — Tunisian names
// ============================================================

const PASSWORD = "Test1234!"; // All demo users share this password

const ADMIN_USER = {
  email: "admin@tawa.tn",
  name: "Youssef Ben Ali",
  phone: "20100100",
};

// 15 providers with Tunisian names
const PROVIDERS_DATA = [
  { email: "ahmed.plombier@tawa.tn", name: "Ahmed Ben Salah", displayName: "Ahmed Plomberie", phone: "22100001", bio: "Plombier professionnel avec 12 ans d'experience a Tunis. Specialise dans les reparations urgentes et les installations sanitaires.", experience: 12, languages: ["Francais", "Arabe"], categorySlug: "plomberie", kycStatus: "APPROVED" as const, isFeatured: true },
  { email: "fatma.menage@tawa.tn", name: "Fatma Trabelsi", displayName: "Fatma Nettoyage Pro", phone: "22100002", bio: "Service de menage et nettoyage professionnel. Produits eco-responsables. Disponible 7j/7 dans le Grand Tunis.", experience: 8, languages: ["Francais", "Arabe"], categorySlug: "menage-nettoyage", kycStatus: "APPROVED" as const, isFeatured: true },
  { email: "mehdi.elec@tawa.tn", name: "Mehdi Gharbi", displayName: "Mehdi Electricite", phone: "22100003", bio: "Electricien agree, interventions rapides. Mise aux normes, depannage, installation complete pour particuliers et professionnels.", experience: 15, languages: ["Francais", "Arabe", "Anglais"], categorySlug: "electricite", kycStatus: "APPROVED" as const, isFeatured: true },
  { email: "amira.cours@tawa.tn", name: "Amira Hammami", displayName: "Amira Cours Particuliers", phone: "22100004", bio: "Enseignante certifiee, diplomee de l'Universite de Tunis. Cours de maths et sciences pour tous niveaux, du primaire au baccalaureat.", experience: 6, languages: ["Francais", "Arabe", "Anglais"], categorySlug: "cours-particuliers", kycStatus: "APPROVED" as const, isFeatured: false },
  { email: "karim.peinture@tawa.tn", name: "Karim Bouazizi", displayName: "Karim Peinture & Deco", phone: "22100005", bio: "Peintre decorateur, travaux de renovation interieure et exterieure. Devis gratuit. References disponibles.", experience: 10, languages: ["Francais", "Arabe"], categorySlug: "peinture-renovation", kycStatus: "APPROVED" as const, isFeatured: false },
  { email: "leila.menage@tawa.tn", name: "Leila Bouzid", displayName: "Leila Services Menage", phone: "22100006", bio: "Femme de menage experimentee. Nettoyage maisons, appartements et bureaux. Repassage inclus sur demande.", experience: 5, languages: ["Francais", "Arabe"], categorySlug: "menage-nettoyage", kycStatus: "APPROVED" as const, isFeatured: false },
  { email: "nabil.demenag@tawa.tn", name: "Nabil Chebbi", displayName: "Nabil Demenagement Express", phone: "22100007", bio: "Demenagement professionnel avec camion equipe. Emballage, transport et installation. Couverture Grand Tunis et banlieue.", experience: 9, languages: ["Francais", "Arabe"], categorySlug: "demenagement", kycStatus: "APPROVED" as const, isFeatured: true },
  { email: "sonia.jardin@tawa.tn", name: "Sonia Maalej", displayName: "Sonia Jardinage", phone: "22100008", bio: "Jardiniere paysagiste. Entretien de jardins, creation d'espaces verts, taille et amenagement. Passionnee par la nature.", experience: 7, languages: ["Francais", "Arabe"], categorySlug: "jardinage", kycStatus: "APPROVED" as const, isFeatured: false },
  { email: "bilel.clim@tawa.tn", name: "Bilel Mansouri", displayName: "Bilel Climatisation", phone: "22100009", bio: "Technicien frigoriste agree. Installation, entretien et reparation de climatiseurs toutes marques. Intervention rapide.", experience: 11, languages: ["Francais", "Arabe"], categorySlug: "climatisation", kycStatus: "APPROVED" as const, isFeatured: false },
  { email: "omar.serrure@tawa.tn", name: "Omar Dridi", displayName: "Omar Serrurerie 24h", phone: "22100010", bio: "Serrurier d'urgence, disponible 24h/24. Ouverture de portes, blindage, changement de serrures. Deplacement rapide.", experience: 14, languages: ["Francais", "Arabe"], categorySlug: "serrurerie", kycStatus: "APPROVED" as const, isFeatured: true },
  { email: "ines.info@tawa.tn", name: "Ines Rezgui", displayName: "Ines Tech Solutions", phone: "22100011", bio: "Informaticienne diplome ingenieur. Reparation PC/Mac, installation reseau, assistance a domicile. Patiente et pedagogique.", experience: 4, languages: ["Francais", "Arabe", "Anglais"], categorySlug: "informatique-tech", kycStatus: "APPROVED" as const, isFeatured: false },
  { email: "yassine.plomb@tawa.tn", name: "Yassine Chaabane", displayName: "Yassine Plomberie SOS", phone: "22100012", bio: "Plombier urgentiste. Debouchage, reparation fuites, installation chauffe-eau. Disponible soirs et weekends.", experience: 8, languages: ["Francais", "Arabe"], categorySlug: "plomberie", kycStatus: "PENDING" as const, isFeatured: false },
  { email: "hana.cours@tawa.tn", name: "Hana Sfar", displayName: "Hana Langues & Soutien", phone: "22100013", bio: "Professeur de langues (francais, anglais, espagnol). Cours particuliers et en petit groupe. Preparation aux examens.", experience: 9, languages: ["Francais", "Arabe", "Anglais", "Espagnol"], categorySlug: "cours-particuliers", kycStatus: "PENDING" as const, isFeatured: false },
  { email: "riadh.renov@tawa.tn", name: "Riadh Belhadj", displayName: "Riadh Renovation Totale", phone: "22100014", bio: "Entrepreneur en renovation generale. Platre, carrelage, peinture, plomberie. Equipe de 3 ouvriers qualifies.", experience: 18, languages: ["Francais", "Arabe"], categorySlug: "peinture-renovation", kycStatus: "NOT_SUBMITTED" as const, isFeatured: false },
  { email: "mariem.jardin@tawa.tn", name: "Mariem Khelifi", displayName: "Mariem Espaces Verts", phone: "22100015", bio: "Amenagement paysager et entretien de jardins. Specialisee dans les jardins mediterraneens. Conseil en plantes locales.", experience: 6, languages: ["Francais", "Arabe"], categorySlug: "jardinage", kycStatus: "APPROVED" as const, isFeatured: false },
];

// 20 clients with Tunisian names
const CLIENTS_DATA = [
  { email: "salma.client@tawa.tn", name: "Salma Mejri", phone: "23200001" },
  { email: "mohamed.client@tawa.tn", name: "Mohamed Lahmar", phone: "23200002" },
  { email: "yasmine.client@tawa.tn", name: "Yasmine Ben Ahmed", phone: "23200003" },
  { email: "ali.client@tawa.tn", name: "Ali Saidi", phone: "23200004" },
  { email: "rim.client@tawa.tn", name: "Rim Chaouachi", phone: "23200005" },
  { email: "houssem.client@tawa.tn", name: "Houssem Jebali", phone: "23200006" },
  { email: "asma.client@tawa.tn", name: "Asma Kchaou", phone: "23200007" },
  { email: "wael.client@tawa.tn", name: "Wael Hamdi", phone: "23200008" },
  { email: "dorra.client@tawa.tn", name: "Dorra Belhaj", phone: "23200009" },
  { email: "fares.client@tawa.tn", name: "Fares Tlili", phone: "23200010" },
  { email: "meryem.client@tawa.tn", name: "Meryem Oueslati", phone: "23200011" },
  { email: "aymen.client@tawa.tn", name: "Aymen Guesmi", phone: "23200012" },
  { email: "nour.client@tawa.tn", name: "Nour Boujelben", phone: "23200013" },
  { email: "hamza.client@tawa.tn", name: "Hamza Baazaoui", phone: "23200014" },
  { email: "sirine.client@tawa.tn", name: "Sirine Haddad", phone: "23200015" },
  { email: "amine.client@tawa.tn", name: "Amine Nasri", phone: "23200016" },
  { email: "emna.client@tawa.tn", name: "Emna Ferchichi", phone: "23200017" },
  { email: "khaled.client@tawa.tn", name: "Khaled Bouslama", phone: "23200018" },
  { email: "sarah.client@tawa.tn", name: "Sarah Mabrouk", phone: "23200019" },
  { email: "zied.client@tawa.tn", name: "Zied Ben Romdhane", phone: "23200020" },
];

// ============================================================
// SERVICE TEMPLATES — realistic TND prices per category
// ============================================================

interface ServiceTemplate {
  title: string;
  description: string;
  pricingType: "FIXED" | "SUR_DEVIS";
  fixedPrice?: number;
  durationMinutes?: number;
  categorySlug: string;
  inclusions: string[];
  exclusions: string[];
}

const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // Plomberie
  { title: "Reparation fuite robinet", description: "Reparation de fuite sur robinet de cuisine ou salle de bain. Diagnostic complet, remplacement des joints et verification de l'etancheite. Intervention rapide avec garantie de 6 mois sur la reparation effectuee.", pricingType: "FIXED", fixedPrice: 45, durationMinutes: 60, categorySlug: "reparation-fuite", inclusions: ["Deplacement", "Diagnostic", "Joints standards"], exclusions: ["Pieces speciales", "Robinet neuf"] },
  { title: "Installation chauffe-eau", description: "Installation complete de chauffe-eau electrique ou a gaz. Raccordement plomberie et electrique, mise en service et verification de securite. Main d'oeuvre et deplacement inclus dans le tarif.", pricingType: "FIXED", fixedPrice: 120, durationMinutes: 180, categorySlug: "installation-sanitaire", inclusions: ["Pose", "Raccordement", "Mise en service"], exclusions: ["Chauffe-eau (fourniture client)", "Travaux de maconnerie"] },
  { title: "Debouchage canalisation", description: "Debouchage de canalisation bouchee (evier, lavabo, douche, WC). Utilisation de furet professionnel et produits adaptes. Nettoyage complet et verification du bon ecoulement apres intervention.", pricingType: "FIXED", fixedPrice: 65, durationMinutes: 90, categorySlug: "debouchage", inclusions: ["Deplacement", "Furet professionnel", "Produits"], exclusions: ["Camera inspection", "Travaux de remplacement"] },
  { title: "Remplacement WC complet", description: "Depose de l'ancien WC, installation du nouveau, raccordement eau et evacuation. Verification de l'etancheite et nettoyage du chantier apres intervention.", pricingType: "FIXED", fixedPrice: 150, durationMinutes: 150, categorySlug: "installation-sanitaire", inclusions: ["Depose ancien", "Installation", "Raccordement"], exclusions: ["WC neuf (fourniture client)"] },
  { title: "Reparation fuite tuyauterie", description: "Localisation et reparation de fuite sur tuyauterie encastree ou apparente. Soudure cuivre ou remplacement de section de tuyau. Garantie 1 an sur les travaux.", pricingType: "SUR_DEVIS", categorySlug: "reparation-fuite", inclusions: ["Diagnostic", "Main d'oeuvre"], exclusions: ["Pieces de remplacement", "Ouverture de mur"] },

  // Electricite
  { title: "Depannage electrique urgent", description: "Intervention d'urgence pour panne electrique : disjoncteur qui saute, prise defaillante, court-circuit. Diagnostic complet du tableau electrique et reparation immediate.", pricingType: "FIXED", fixedPrice: 55, durationMinutes: 60, categorySlug: "depannage-electrique", inclusions: ["Deplacement", "Diagnostic", "Reparation simple"], exclusions: ["Remplacement tableau", "Pieces speciales"] },
  { title: "Installation tableau electrique", description: "Mise en place ou remplacement d'un tableau electrique aux normes tunisiennes. Disjoncteur differentiel, repartition des circuits et mise a la terre. Certificat de conformite fourni.", pricingType: "SUR_DEVIS", categorySlug: "installation-electrique", inclusions: ["Etude", "Installation", "Certificat"], exclusions: ["Fourniture du tableau"] },
  { title: "Pose lustre et eclairage LED", description: "Installation de lustre, appliques murales ou eclairage LED. Branchement electrique securise, reglage et essais. Service propre et soigne.", pricingType: "FIXED", fixedPrice: 35, durationMinutes: 45, categorySlug: "eclairage", inclusions: ["Pose", "Branchement", "Essais"], exclusions: ["Luminaire (fourniture client)"] },
  { title: "Mise aux normes installation", description: "Verification complete de l'installation electrique et mise aux normes. Remplacement des elements defectueux, ajout de prises de terre et de protection differentielle.", pricingType: "SUR_DEVIS", categorySlug: "installation-electrique", inclusions: ["Audit complet", "Rapport de conformite"], exclusions: ["Travaux de remplacement"] },

  // Menage & Nettoyage
  { title: "Menage complet appartement", description: "Nettoyage integral de votre appartement : sols, cuisine, salle de bain, chambres et salon. Produits professionnels fournis. Resultat impeccable garanti.", pricingType: "FIXED", fixedPrice: 80, durationMinutes: 240, categorySlug: "menage-domicile", inclusions: ["Produits", "Materiel", "Toutes les pieces"], exclusions: ["Repassage", "Nettoyage terrasse"] },
  { title: "Nettoyage fin de chantier", description: "Nettoyage professionnel apres travaux de construction ou renovation. Evacuation des debris, lavage des sols, nettoyage des vitres et sanitaires. Equipe de 2 personnes.", pricingType: "SUR_DEVIS", categorySlug: "nettoyage-chantier", inclusions: ["Equipe de 2", "Materiel professionnel", "Evacuation debris"], exclusions: ["Benne a gravats"] },
  { title: "Nettoyage vitres maison", description: "Nettoyage complet de toutes les vitres et baies vitrees de votre maison ou appartement. Interieur et exterieur. Produits anti-traces pour un resultat cristallin.", pricingType: "FIXED", fixedPrice: 50, durationMinutes: 120, categorySlug: "nettoyage-vitres", inclusions: ["Interieur + exterieur", "Produits anti-traces"], exclusions: ["Vitres en hauteur (etage > 3)"] },
  { title: "Grand menage de printemps", description: "Nettoyage en profondeur de votre maison : placards, derriere les meubles, plinthes, lustres, electromenager. Ideal pour un nouveau depart. Duree 6 a 8 heures.", pricingType: "FIXED", fixedPrice: 120, durationMinutes: 420, categorySlug: "menage-domicile", inclusions: ["Nettoyage profond", "Placards", "Electromenager"], exclusions: ["Produits specifiques marbre"] },

  // Cours particuliers
  { title: "Cours de maths niveau lycee", description: "Cours particuliers de mathematiques pour eleves de lycee (1ere, 2eme et 3eme annee). Preparation au baccalaureat, exercices corriges et methodologie de resolution de problemes.", pricingType: "FIXED", fixedPrice: 30, durationMinutes: 90, categorySlug: "mathematiques", inclusions: ["Support de cours", "Exercices corriges", "Suivi WhatsApp"], exclusions: [] },
  { title: "Cours d'anglais tous niveaux", description: "Cours d'anglais adaptes a votre niveau : debutant, intermediaire ou avance. Conversation, grammaire, preparation TOEFL/IELTS. Enseignante bilingue certifiee Cambridge.", pricingType: "FIXED", fixedPrice: 35, durationMinutes: 60, categorySlug: "langues", inclusions: ["Cours personnalise", "Documents fournis"], exclusions: ["Frais d'inscription examens"] },
  { title: "Initiation informatique seniors", description: "Cours d'informatique pour debutants et seniors. Utilisation de l'ordinateur, internet, email, reseaux sociaux. Patience et pedagogie garanties. A domicile.", pricingType: "FIXED", fixedPrice: 25, durationMinutes: 60, categorySlug: "informatique", inclusions: ["Cours a domicile", "Support papier"], exclusions: ["Achat materiel"] },
  { title: "Cours de physique-chimie", description: "Cours de sciences physiques et chimie niveau college et lycee. Explication des concepts, experiences pratiques simples et preparation aux examens.", pricingType: "FIXED", fixedPrice: 30, durationMinutes: 90, categorySlug: "sciences", inclusions: ["Cours", "Exercices", "Revisions examens"], exclusions: [] },
  { title: "Soutien scolaire primaire", description: "Aide aux devoirs et soutien scolaire pour eleves du primaire. Toutes les matieres. Methode ludique et bienveillante pour redonner confiance a votre enfant.", pricingType: "FIXED", fixedPrice: 20, durationMinutes: 60, categorySlug: "mathematiques", inclusions: ["Toutes matieres", "Aide aux devoirs"], exclusions: [] },

  // Peinture & Renovation
  { title: "Peinture piece standard", description: "Peinture complete d'une piece standard (jusqu'a 15m2). Preparation des murs, enduit, deux couches de peinture lavable. Couleur au choix du client.", pricingType: "FIXED", fixedPrice: 180, durationMinutes: 480, categorySlug: "peinture-interieure", inclusions: ["Preparation murs", "Peinture 2 couches", "Nettoyage"], exclusions: ["Peinture (fourniture client)", "Reparation fissures profondes"] },
  { title: "Peinture facade maison", description: "Peinture exterieure de facade de maison ou immeuble. Traitement anti-humidite, enduit exterieur et peinture resistante aux intemperies. Devis sur place gratuit.", pricingType: "SUR_DEVIS", categorySlug: "peinture-exterieure", inclusions: ["Devis gratuit", "Traitement anti-humidite"], exclusions: ["Echafaudage (si > 2 etages)", "Fourniture peinture"] },
  { title: "Renovation complete salle de bain", description: "Renovation totale de votre salle de bain : demolition, carrelage, plomberie, peinture, installation sanitaire. Equipe qualifiee, finitions soignees.", pricingType: "SUR_DEVIS", categorySlug: "renovation-generale", inclusions: ["Conception", "Main d'oeuvre complete", "Nettoyage"], exclusions: ["Fournitures (carrelage, sanitaire)"] },

  // Demenagement
  { title: "Demenagement appartement F3", description: "Demenagement complet d'un appartement F3 dans le Grand Tunis. Camion avec hayon, 2 demenageurs, protection des meubles. Montage et demontage des meubles simples inclus.", pricingType: "FIXED", fixedPrice: 250, durationMinutes: 360, categorySlug: "demenagement-local", inclusions: ["Camion", "2 demenageurs", "Protection meubles", "Montage/demontage"], exclusions: ["Emballage cartons", "Stockage"] },
  { title: "Transport meuble volumineux", description: "Transport d'un meuble volumineux (armoire, canape, lit) d'un point A a B dans le Grand Tunis. Deux manutentionnaires et camionnette adaptee.", pricingType: "FIXED", fixedPrice: 80, durationMinutes: 120, categorySlug: "transport-meubles", inclusions: ["Transport", "2 manutentionnaires", "Protection"], exclusions: ["Montage si demonte"] },

  // Jardinage
  { title: "Entretien mensuel jardin", description: "Entretien complet de votre jardin une fois par mois : tonte pelouse, desherbage, taille arbustes, ramassage feuilles. Jardin jusqu'a 200m2.", pricingType: "FIXED", fixedPrice: 60, durationMinutes: 180, categorySlug: "entretien-jardin", inclusions: ["Tonte", "Desherbage", "Taille", "Nettoyage"], exclusions: ["Engrais", "Evacuation dechets verts"] },
  { title: "Taille de haies et arbustes", description: "Taille professionnelle de haies, arbustes et petits arbres. Jusqu'a 20 metres lineaires de haie. Forme au choix, nettoyage des coupes inclus.", pricingType: "FIXED", fixedPrice: 45, durationMinutes: 120, categorySlug: "taille-haies", inclusions: ["Taille", "Nettoyage coupes"], exclusions: ["Evacuation dechets", "Arbres grands > 4m"] },
  { title: "Creation jardin mediterraneen", description: "Conception et realisation d'un jardin mediterraneen adapte au climat tunisien. Choix des plantes, systeme d'arrosage automatique, paillage.", pricingType: "SUR_DEVIS", categorySlug: "amenagement-paysager", inclusions: ["Conception", "Plan 3D", "Conseil plantes"], exclusions: ["Plantes et fournitures", "Arrosage automatique"] },

  // Climatisation
  { title: "Installation split climatiseur", description: "Installation d'un split (unite interieure + exterieure). Percage, passage de tuyauterie, raccordement electrique, mise sous vide et test de fonctionnement.", pricingType: "FIXED", fixedPrice: 180, durationMinutes: 240, categorySlug: "installation-clim", inclusions: ["Installation", "Raccordement", "Mise en service", "Garantie 1 an"], exclusions: ["Climatiseur (fourniture client)", "Support mural exterieur si specifique"] },
  { title: "Entretien annuel climatiseur", description: "Nettoyage complet du climatiseur : filtres, echangeur, bac a condensat. Verification du gaz refrigerant et des performances. Prolonge la duree de vie de votre appareil.", pricingType: "FIXED", fixedPrice: 50, durationMinutes: 60, categorySlug: "entretien-clim", inclusions: ["Nettoyage complet", "Verification gaz", "Rapport"], exclusions: ["Recharge gaz", "Pieces de rechange"] },
  { title: "Reparation climatiseur en panne", description: "Diagnostic et reparation de climatiseur : pas de froid, bruit anormal, fuite d'eau, erreur affichee. Toutes marques. Pieces d'origine si remplacement necessaire.", pricingType: "FIXED", fixedPrice: 70, durationMinutes: 90, categorySlug: "reparation-clim", inclusions: ["Diagnostic", "Reparation", "Essais"], exclusions: ["Pieces de rechange", "Recharge gaz"] },

  // Serrurerie
  { title: "Ouverture de porte claquee", description: "Ouverture de porte claquee ou fermee sans cle. Technique non destructive privilegiee. Disponible 24h/24, intervention en 30 minutes dans le Grand Tunis.", pricingType: "FIXED", fixedPrice: 60, durationMinutes: 30, categorySlug: "ouverture-porte", inclusions: ["Deplacement", "Ouverture non destructive"], exclusions: ["Remplacement serrure si necessaire"] },
  { title: "Changement serrure 3 points", description: "Remplacement de votre serrure par une serrure de securite 3 points. Installation, reglage et remise de 3 jeux de cles. Marques europeennes de qualite.", pricingType: "FIXED", fixedPrice: 150, durationMinutes: 60, categorySlug: "changement-serrure", inclusions: ["Serrure 3 points", "Installation", "3 jeux de cles"], exclusions: ["Blindage de porte"] },

  // Informatique & Tech
  { title: "Reparation PC lent/virus", description: "Diagnostic et optimisation de votre PC : suppression des virus et malwares, nettoyage systeme, mise a jour, acceleration du demarrage. Sauvegarde de vos donnees.", pricingType: "FIXED", fixedPrice: 40, durationMinutes: 120, categorySlug: "reparation-pc", inclusions: ["Diagnostic", "Nettoyage virus", "Optimisation"], exclusions: ["Remplacement pieces hardware", "Reinstallation Windows"] },
  { title: "Installation reseau WiFi maison", description: "Installation et configuration de votre reseau WiFi domestique. Routeur, repeteur si necessaire, securisation du reseau. Configuration de tous vos appareils.", pricingType: "FIXED", fixedPrice: 55, durationMinutes: 90, categorySlug: "installation-reseau", inclusions: ["Installation", "Configuration", "Securisation"], exclusions: ["Materiel (routeur, repeteur)"] },
  { title: "Assistance informatique domicile", description: "Aide informatique a domicile : installation logiciels, configuration email, transfer de donnees, formation basique. Patiente et pedagogique.", pricingType: "FIXED", fixedPrice: 30, durationMinutes: 60, categorySlug: "assistance-informatique", inclusions: ["Deplacement", "1h d'assistance"], exclusions: ["Logiciels payants", "Materiel"] },

  // Extra services for variety
  { title: "Menage bureau professionnel", description: "Nettoyage de bureaux et espaces professionnels. Aspiration, lavage sols, nettoyage bureaux, sanitaires et cuisine. Service regulier ou ponctuel.", pricingType: "FIXED", fixedPrice: 90, durationMinutes: 180, categorySlug: "menage-domicile", inclusions: ["Nettoyage complet", "Produits fournis"], exclusions: ["Nettoyage moquette specialise"] },
  { title: "Cours de francais FLE", description: "Cours de francais langue etrangere. Grammaire, expression orale et ecrite, comprehension. Preparation aux examens DELF/DALF. Professeur diplome.", pricingType: "FIXED", fixedPrice: 35, durationMinutes: 60, categorySlug: "langues", inclusions: ["Cours personnalise", "Supports"], exclusions: [] },
  { title: "Pose de carrelage sol", description: "Pose de carrelage au sol : preparation du support, pose droite ou diagonale, joints. Surface jusqu'a 20m2. Finitions propres et soignees.", pricingType: "FIXED", fixedPrice: 220, durationMinutes: 480, categorySlug: "renovation-generale", inclusions: ["Preparation sol", "Pose", "Joints"], exclusions: ["Carrelage (fourniture client)", "Depose ancien carrelage"] },
  { title: "Installation camera surveillance", description: "Installation de systeme de video-surveillance pour maison ou commerce. Configuration, acces distant sur smartphone, stockage cloud ou local.", pricingType: "SUR_DEVIS", categorySlug: "installation-reseau", inclusions: ["Installation", "Configuration", "Formation"], exclusions: ["Cameras et enregistreur"] },
];

// ============================================================
// FRENCH REVIEW COMMENTS
// ============================================================

const REVIEW_COMMENTS = [
  "Excellent travail ! Ahmed est arrive a l'heure et a repare la fuite en moins d'une heure. Tres professionnel, je recommande vivement.",
  "Service impeccable. L'appartement n'a jamais ete aussi propre. Fatma est tres minutieuse et agreable.",
  "Mehdi a diagnostique le probleme electrique rapidement. Tres competent, prix raisonnable. Merci !",
  "Tres bonne enseignante. Ma fille a progresse de 2 points en maths grace aux cours d'Amira.",
  "Karim a fait un travail magnifique sur la peinture du salon. Couleurs parfaites, murs lisses. Bravo !",
  "Leila est ponctuelle et tres efficace. La maison est toujours nickel apres son passage.",
  "Demenagement rapide et sans casse. L'equipe de Nabil est serieuse et bien organisee.",
  "Sonia a transforme notre jardin ! C'est devenu un vrai espace de detente. Merci pour les conseils.",
  "Installation du climatiseur faite dans les regles de l'art. Bilel connait bien son metier.",
  "Omar est venu en urgence a 23h pour ouvrir ma porte claquee. Rapide et efficace. Sauveur !",
  "Ines a repare mon PC qui etait tres lent. Elle a tout explique clairement. Tres patiente.",
  "Travail soigne et rapide. La salle de bain est comme neuve. Equipe respectueuse et propre.",
  "Les cours d'anglais avec Hana sont excellents. Pedagogie adaptee et bonne humeur au rendez-vous.",
  "Debouchage efficace, plus aucun probleme depuis l'intervention. Ahmed est un vrai pro.",
  "Nettoyage des vitres parfait, pas une trace ! Je suis vraiment satisfaite du resultat.",
  "Le menage de printemps etait exactement ce dont on avait besoin. Tout brille maintenant.",
  "Installation rapide du reseau WiFi. Enfin du WiFi partout dans la maison ! Merci Ines.",
  "Bon cours de physique, mon fils comprend enfin la mecanique. Professeur claire et organisee.",
  "Taille de haies impeccable. Le jardin a retrouve une belle forme. Sonia est vraiment douee.",
  "Entretien du climatiseur fait rapidement. Il refroidit beaucoup mieux maintenant.",
  "Super prestataire ! Le demenagement s'est passe sans stress. Tout est arrive intact.",
  "Reparation du chauffe-eau efficace. Plus de panne depuis. Tres bon rapport qualite-prix.",
  "Cours de maths tres bien structures. Les notes de ma fille remontent enfin. Merci Amira !",
  "Changement de serrure fait proprement. Omar a meme nettoye la porte apres. Top !",
  "Excellente prestation de peinture. Karim est meticuleux et les finitions sont parfaites.",
  "La facade de la maison est comme neuve. Travail propre et bien fait malgre la chaleur.",
  "Menage du bureau impeccable comme d'habitude. On compte sur Fatma chaque semaine.",
  "Assistance informatique au top ! Configuration de la tablette pour ma mere en toute patience.",
];

// ============================================================
// MESSAGE TEMPLATES
// ============================================================

const MESSAGE_THREADS = [
  [
    { fromClient: true, content: "Bonjour, je voudrais reserver votre service de plomberie pour une fuite au robinet de la cuisine." },
    { fromClient: false, content: "Bonjour ! Bien sur, pouvez-vous m'envoyer une photo de la fuite ? Est-ce que ca goutte en continu ?" },
    { fromClient: true, content: "Oui ca goutte sans arret. Je vous envoie une photo des que possible. C'est un robinet mitigeur." },
    { fromClient: false, content: "D'accord, c'est probablement le joint ou la cartouche. Je peux passer demain matin vers 9h, ca vous convient ?" },
    { fromClient: true, content: "Parfait pour demain 9h. Merci pour votre reactivite !" },
  ],
  [
    { fromClient: true, content: "Bonjour Fatma, est-ce que vous etes disponible samedi pour un menage complet de mon appartement ?" },
    { fromClient: false, content: "Bonjour ! Samedi matin je suis libre. C'est un appartement de quelle surface environ ?" },
    { fromClient: true, content: "Environ 90m2, 3 chambres, salon, cuisine et 2 salles de bain." },
    { fromClient: false, content: "Parfait, je serai la vers 8h30. Comptez environ 4 heures. Est-ce que vous avez un aspirateur ?" },
    { fromClient: true, content: "Oui j'ai tout le materiel. A samedi alors, merci !" },
  ],
  [
    { fromClient: true, content: "Bonjour, mon disjoncteur saute regulierement depuis 2 jours. Pouvez-vous intervenir ?" },
    { fromClient: false, content: "Bonjour, ca ressemble a un court-circuit ou une surcharge. Ne touchez a rien, je peux venir cet apres-midi." },
    { fromClient: true, content: "Merci beaucoup ! Je suis disponible a partir de 14h." },
  ],
  [
    { fromClient: true, content: "Bonjour Amira, ma fille est en 2eme annee secondaire et elle a beaucoup de difficultes en maths. Quels sont vos tarifs ?" },
    { fromClient: false, content: "Bonjour ! Pour le lycee c'est 30 DT la seance de 1h30. On peut commencer par une seance d'evaluation gratuite pour identifier les lacunes." },
    { fromClient: true, content: "C'est tres gentil ! On peut fixer la seance d'evaluation pour ce mercredi ?" },
    { fromClient: false, content: "Mercredi 16h chez vous ? Apportez les derniers controles et le cahier de cours. A mercredi !" },
  ],
  [
    { fromClient: true, content: "Bonjour, j'ai besoin d'un demenagement pour un F3 de La Marsa vers Ariana. C'est possible ce weekend ?" },
    { fromClient: false, content: "Bonjour ! Ce samedi oui. Avez-vous des meubles tres lourds ou volumineux ? Un piano, un coffre-fort ?" },
    { fromClient: true, content: "Non, mobilier classique : salon, 2 chambres, cuisine. Et quelques cartons." },
    { fromClient: false, content: "Parfait, je viendrai avec mon camion et 2 gars. Debut a 7h du matin pour eviter la chaleur. Ca vous va ?" },
    { fromClient: true, content: "7h c'est parfait. Combien de temps ca va prendre ?" },
    { fromClient: false, content: "Entre La Marsa et Ariana, comptez 5 a 6 heures tout compris. Je vous confirme samedi matin." },
  ],
];

// ============================================================
// HELPERS
// ============================================================

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
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

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function main() {
  const passwordHash = await hash(PASSWORD, 12);

  // ----------------------------------------------------------
  // 1. GOUVERNORATS & DELEGATIONS
  // ----------------------------------------------------------
  console.log("Seeding gouvernorats & delegations...");
  const delegationMap: Record<string, string> = {}; // name -> id

  for (const gov of GOUVERNORATS_DATA) {
    const created = await prisma.gouvernorat.upsert({
      where: { name: gov.name },
      update: {},
      create: { name: gov.name, code: gov.code },
    });

    for (const delName of gov.delegations) {
      const del = await prisma.delegation.upsert({
        where: { name_gouvernoratId: { name: delName, gouvernoratId: created.id } },
        update: {},
        create: { name: delName, gouvernoratId: created.id },
      });
      delegationMap[delName] = del.id;
    }
  }
  console.log(`  -> ${GOUVERNORATS_DATA.length} gouvernorats seeded`);

  // ----------------------------------------------------------
  // 2. CATEGORIES
  // ----------------------------------------------------------
  console.log("Seeding categories...");
  const categoryMap: Record<string, string> = {}; // slug -> id

  for (let i = 0; i < CATEGORIES_DATA.length; i++) {
    const cat = CATEGORIES_DATA[i]!;
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, sortOrder: i },
    });
    categoryMap[cat.slug] = parent.id;

    for (let j = 0; j < cat.children.length; j++) {
      const child = cat.children[j]!;
      const childCat = await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: { name: child.name, slug: child.slug, parentId: parent.id, sortOrder: j },
      });
      categoryMap[child.slug] = childCat.id;
    }
  }
  console.log(`  -> ${CATEGORIES_DATA.length} parent categories seeded`);

  // ----------------------------------------------------------
  // 3. ADMIN USER
  // ----------------------------------------------------------
  console.log("Seeding admin user...");
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_USER.email },
    update: {},
    create: {
      email: ADMIN_USER.email,
      name: ADMIN_USER.name,
      phone: ADMIN_USER.phone,
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log(`  -> Admin: ${admin.email}`);

  // ----------------------------------------------------------
  // 4. CLIENTS
  // ----------------------------------------------------------
  console.log("Seeding 20 client users...");
  const clientIds: string[] = [];

  for (const c of CLIENTS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        phone: c.phone,
        passwordHash,
        role: "CLIENT",
        emailVerified: true,
        phoneVerified: Math.random() > 0.3,
      },
    });
    clientIds.push(user.id);
  }
  console.log(`  -> ${clientIds.length} clients seeded`);

  // ----------------------------------------------------------
  // 5. PROVIDERS
  // ----------------------------------------------------------
  console.log("Seeding 15 providers...");
  const providerIds: string[] = [];
  const providerUserIds: string[] = [];
  const providerCategorySlugs: string[] = [];

  for (const p of PROVIDERS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        phone: p.phone,
        passwordHash,
        role: "PROVIDER",
        emailVerified: true,
        phoneVerified: true,
      },
    });
    providerUserIds.push(user.id);

    // Upsert provider profile
    const provider = await prisma.provider.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: p.displayName,
        bio: p.bio,
        phone: p.phone,
        kycStatus: p.kycStatus,
        kycSubmittedAt: p.kycStatus !== "NOT_SUBMITTED" ? daysAgo(30) : undefined,
        kycApprovedAt: p.kycStatus === "APPROVED" ? daysAgo(25) : undefined,
        yearsExperience: p.experience,
        languages: p.languages,
        rating: p.kycStatus === "APPROVED" ? parseFloat((3.5 + Math.random() * 1.5).toFixed(1)) : 0,
        ratingCount: p.kycStatus === "APPROVED" ? Math.floor(5 + Math.random() * 30) : 0,
        completedMissions: p.kycStatus === "APPROVED" ? Math.floor(10 + Math.random() * 50) : 0,
        responseTimeHours: parseFloat((0.5 + Math.random() * 3).toFixed(1)),
        responseRate: parseFloat((80 + Math.random() * 20).toFixed(0)),
        isFeatured: p.isFeatured,
        isActive: true,
      },
    });
    providerIds.push(provider.id);
    providerCategorySlugs.push(p.categorySlug);

    // Assign delegations (2-4 random ones from Tunis region)
    const tunisDelegations = ["Tunis Ville", "Le Bardo", "La Marsa", "Sidi Bou Said", "Carthage", "La Goulette", "Ariana Ville", "La Soukra", "Ben Arous", "Rades"];
    const numDelegations = 2 + Math.floor(Math.random() * 3);
    const shuffled = tunisDelegations.sort(() => Math.random() - 0.5);
    for (let d = 0; d < numDelegations; d++) {
      const delId = delegationMap[shuffled[d]!];
      if (delId) {
        await prisma.providerDelegation.upsert({
          where: { providerId_delegationId: { providerId: provider.id, delegationId: delId } },
          update: {},
          create: { providerId: provider.id, delegationId: delId },
        });
      }
    }

    // Availability (Mon-Sat 8:00-18:00)
    for (let day = 1; day <= 6; day++) {
      await prisma.availability.upsert({
        where: { providerId_dayOfWeek: { providerId: provider.id, dayOfWeek: day } },
        update: {},
        create: {
          providerId: provider.id,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: day === 6 ? "13:00" : "18:00",
        },
      });
    }

    // Trust badges for approved providers
    if (p.kycStatus === "APPROVED") {
      await prisma.trustBadge.upsert({
        where: { providerId_badgeType: { providerId: provider.id, badgeType: "IDENTITY_VERIFIED" } },
        update: {},
        create: { providerId: provider.id, badgeType: "IDENTITY_VERIFIED" },
      });
      if (p.isFeatured) {
        await prisma.trustBadge.upsert({
          where: { providerId_badgeType: { providerId: provider.id, badgeType: "TOP_PROVIDER" } },
          update: {},
          create: { providerId: provider.id, badgeType: "TOP_PROVIDER" },
        });
      }
    }

    // KYC documents for approved and pending providers
    if (p.kycStatus === "APPROVED" || p.kycStatus === "PENDING") {
      for (const docType of ["CIN_RECTO", "CIN_VERSO", "SELFIE"]) {
        await prisma.kYCDocument.upsert({
          where: { id: `kyc-${provider.id}-${docType}` },
          update: {},
          create: {
            id: `kyc-${provider.id}-${docType}`,
            providerId: provider.id,
            docType,
            fileUrl: `/uploads/kyc/${docType.toLowerCase()}_placeholder.jpg`,
          },
        });
      }
    }
  }
  console.log(`  -> ${providerIds.length} providers seeded`);

  // ----------------------------------------------------------
  // 6. SERVICES (50+)
  // ----------------------------------------------------------
  console.log("Seeding services...");
  const serviceIds: string[] = [];
  const serviceProviderMap: Record<string, number> = {}; // serviceId -> provider index

  for (let i = 0; i < SERVICE_TEMPLATES.length; i++) {
    const tmpl = SERVICE_TEMPLATES[i]!;
    const catId = categoryMap[tmpl.categorySlug];
    if (!catId) continue;

    // Find a matching provider for this category
    const parentCatSlug = CATEGORIES_DATA.find(c => c.children.some(ch => ch.slug === tmpl.categorySlug))?.slug || tmpl.categorySlug;
    let providerIdx = providerCategorySlugs.findIndex(s => s === parentCatSlug);
    if (providerIdx < 0) providerIdx = i % providerIds.length;

    // Some services have a second provider offering them
    const providerIndices = [providerIdx];
    // Find if there's another provider for the same category
    const secondIdx = providerCategorySlugs.findIndex((s, idx) => s === parentCatSlug && idx !== providerIdx);
    if (secondIdx >= 0 && i % 3 === 0) providerIndices.push(secondIdx);

    for (const pIdx of providerIndices) {
      const providerId = providerIds[pIdx]!;
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
          status: "ACTIVE",
          viewCount: Math.floor(10 + Math.random() * 200),
        },
      });
      serviceIds.push(service.id);
      serviceProviderMap[service.id] = pIdx;
    }
  }
  console.log(`  -> ${serviceIds.length} services seeded`);

  // ----------------------------------------------------------
  // 7. BOOKINGS (40+) — all statuses
  // ----------------------------------------------------------
  console.log("Seeding bookings...");
  const bookingIds: string[] = [];
  const bookingMeta: { id: string; clientIdx: number; providerIdx: number; serviceId: string; status: string }[] = [];

  // Status distribution for realism
  const statusDistribution: { status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED"; count: number }[] = [
    { status: "COMPLETED", count: 18 },
    { status: "ACCEPTED", count: 6 },
    { status: "PENDING", count: 6 },
    { status: "IN_PROGRESS", count: 5 },
    { status: "REJECTED", count: 3 },
    { status: "CANCELLED", count: 4 },
  ];

  let bookingIndex = 0;
  for (const { status, count } of statusDistribution) {
    for (let i = 0; i < count; i++) {
      const clientIdx = bookingIndex % clientIds.length;
      const serviceId = serviceIds[bookingIndex % serviceIds.length]!;
      const providerIdx = serviceProviderMap[serviceId] ?? 0;
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      const amount = service?.fixedPrice ?? (50 + Math.floor(Math.random() * 200));

      const scheduledAt = status === "COMPLETED" || status === "REJECTED" || status === "CANCELLED"
        ? randomDate(daysAgo(60), daysAgo(5))
        : randomDate(daysFromNow(1), daysFromNow(30));

      const booking = await prisma.booking.create({
        data: {
          clientId: clientIds[clientIdx]!,
          providerId: providerIds[providerIdx]!,
          serviceId,
          status,
          scheduledAt,
          completedAt: status === "COMPLETED" ? new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000) : null,
          cancelledAt: status === "CANCELLED" ? new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000) : null,
          cancelledBy: status === "CANCELLED" ? (Math.random() > 0.5 ? "CLIENT" : "PROVIDER") : null,
          cancelReason: status === "CANCELLED" ? "Imprevus personnels" : null,
          totalAmount: amount,
          clientNote: i % 3 === 0 ? "Merci de sonner a l'interphone, appartement 3B." : null,
        },
      });

      bookingIds.push(booking.id);
      bookingMeta.push({ id: booking.id, clientIdx, providerIdx, serviceId, status });

      // Create payment for accepted, in_progress, completed, cancelled (with held/released/refunded)
      if (status !== "PENDING" && status !== "REJECTED") {
        const commission = parseFloat((amount * 0.12).toFixed(2));
        const providerEarning = parseFloat((amount - commission).toFixed(2));
        const paymentMethod = randomElement(["CARD", "D17", "FLOUCI", "CASH"] as const);

        let paymentStatus: "PENDING" | "HELD" | "RELEASED" | "REFUNDED" = "PENDING";
        if (status === "COMPLETED") paymentStatus = "RELEASED";
        else if (status === "IN_PROGRESS" || status === "ACCEPTED") paymentStatus = "HELD";
        else if (status === "CANCELLED") paymentStatus = "REFUNDED";

        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            method: paymentMethod,
            status: paymentStatus,
            amount,
            commission,
            providerEarning,
            paidAt: daysAgo(Math.floor(Math.random() * 30)),
            heldAt: paymentStatus !== "PENDING" ? daysAgo(Math.floor(Math.random() * 25)) : null,
            releasedAt: paymentStatus === "RELEASED" ? daysAgo(Math.floor(Math.random() * 10)) : null,
            refundedAt: paymentStatus === "REFUNDED" ? daysAgo(Math.floor(Math.random() * 5)) : null,
            refundAmount: paymentStatus === "REFUNDED" ? amount * 0.5 : null,
          },
        });
      }

      bookingIndex++;
    }
  }
  console.log(`  -> ${bookingIds.length} bookings seeded`);

  // ----------------------------------------------------------
  // 8. DEMO SCENARIO: Salma → Ahmed plumber flow
  // ----------------------------------------------------------
  console.log("Seeding demo scenario: Salma -> Ahmed...");
  const salmaId = clientIds[0]!; // Salma is the first client
  const ahmedProviderIdx = 0; // Ahmed is the first provider
  const ahmedProviderId = providerIds[ahmedProviderIdx]!;
  // Find Ahmed's plumbing service
  const ahmedServiceId = serviceIds.find(sid => serviceProviderMap[sid] === ahmedProviderIdx) || serviceIds[0]!;

  const demoBooking = await prisma.booking.create({
    data: {
      clientId: salmaId,
      providerId: ahmedProviderId,
      serviceId: ahmedServiceId,
      status: "COMPLETED",
      scheduledAt: daysAgo(3),
      completedAt: daysAgo(2),
      totalAmount: 45,
      clientNote: "Fuite au robinet de la cuisine, merci de venir avec les outils necessaires.",
    },
  });

  // Payment for demo booking
  await prisma.payment.create({
    data: {
      bookingId: demoBooking.id,
      method: "FLOUCI",
      status: "RELEASED",
      amount: 45,
      commission: 5.40,
      providerEarning: 39.60,
      paidAt: daysAgo(3),
      heldAt: daysAgo(3),
      releasedAt: daysAgo(2),
    },
  });

  // Salma's 5-star review for Ahmed
  await prisma.review.create({
    data: {
      bookingId: demoBooking.id,
      authorId: salmaId,
      targetId: (await prisma.provider.findUnique({ where: { id: ahmedProviderId } }))!.userId,
      authorRole: "CLIENT",
      stars: 5,
      qualityRating: 5,
      punctualityRating: 5,
      communicationRating: 5,
      cleanlinessRating: 5,
      text: "Excellent travail ! Ahmed est arrive a l'heure et a repare la fuite en moins d'une heure. Tres professionnel, je recommande vivement. La Marsa a enfin un bon plombier de confiance !",
      published: true,
      publishedAt: daysAgo(1),
    },
  });

  // Conversation for demo scenario
  const demoConversation = await prisma.conversation.create({
    data: { bookingId: demoBooking.id },
  });

  const demoMessages = [
    { senderId: salmaId, content: "Bonjour Ahmed, j'ai une fuite au robinet de la cuisine. Est-ce que vous pouvez passer cette semaine ?" },
    { senderId: (await prisma.provider.findUnique({ where: { id: ahmedProviderId } }))!.userId, content: "Bonjour Salma ! Bien sur, je suis disponible demain matin. La fuite est au niveau du robinet ou sous l'evier ?" },
    { senderId: salmaId, content: "C'est le robinet qui goutte en permanence. Meme quand il est bien ferme." },
    { senderId: (await prisma.provider.findUnique({ where: { id: ahmedProviderId } }))!.userId, content: "D'accord, c'est probablement la cartouche ou le joint. Je passerai demain a 9h avec tout le necessaire." },
    { senderId: salmaId, content: "Parfait ! Je suis a La Marsa, rue du Lac Malaren. Je vous envoie la localisation." },
    { senderId: (await prisma.provider.findUnique({ where: { id: ahmedProviderId } }))!.userId, content: "Bien recu. A demain, bonne soiree !" },
    { senderId: salmaId, content: "Merci Ahmed, le robinet ne fuit plus du tout ! Excellent travail." },
    { senderId: (await prisma.provider.findUnique({ where: { id: ahmedProviderId } }))!.userId, content: "Merci Salma ! N'hesitez pas si vous avez besoin de quoi que ce soit. Bonne journee !" },
  ];

  for (let i = 0; i < demoMessages.length; i++) {
    await prisma.message.create({
      data: {
        conversationId: demoConversation.id,
        senderId: demoMessages[i]!.senderId,
        content: demoMessages[i]!.content,
        isRead: true,
        readAt: daysAgo(3 - Math.floor(i / 2)),
        createdAt: new Date(daysAgo(4).getTime() + i * 30 * 60 * 1000),
      },
    });
  }
  console.log("  -> Demo scenario created (Salma -> Ahmed -> 5 stars)");

  // ----------------------------------------------------------
  // 9. REVIEWS (25+) — French comments
  // ----------------------------------------------------------
  console.log("Seeding reviews...");
  let reviewCount = 0;
  const completedBookings = bookingMeta.filter(b => b.status === "COMPLETED");

  for (let i = 0; i < Math.min(completedBookings.length, REVIEW_COMMENTS.length); i++) {
    const b = completedBookings[i]!;
    const comment = REVIEW_COMMENTS[i]!;
    const stars = 3 + Math.floor(Math.random() * 3); // 3-5 stars

    try {
      await prisma.review.create({
        data: {
          bookingId: b.id,
          authorId: clientIds[b.clientIdx]!,
          targetId: providerUserIds[b.providerIdx]!,
          authorRole: "CLIENT",
          stars,
          qualityRating: Math.max(3, stars - Math.floor(Math.random() * 2)),
          punctualityRating: Math.max(3, stars - Math.floor(Math.random() * 2)),
          communicationRating: Math.min(5, stars + Math.floor(Math.random() * 2)),
          cleanlinessRating: Math.max(3, stars - Math.floor(Math.random() * 2)),
          text: comment,
          published: Math.random() > 0.1,
          publishedAt: Math.random() > 0.1 ? daysAgo(Math.floor(Math.random() * 20)) : null,
          flagged: Math.random() > 0.9,
        },
      });
      reviewCount++;
    } catch {
      // Skip duplicate bookingId+authorId pairs
    }
  }
  console.log(`  -> ${reviewCount} reviews seeded`);

  // ----------------------------------------------------------
  // 10. CONVERSATIONS & MESSAGES
  // ----------------------------------------------------------
  console.log("Seeding conversations & messages...");
  let messageCount = 0;

  const bookingsForMessages = bookingMeta.filter(b =>
    b.status === "ACCEPTED" || b.status === "IN_PROGRESS" || b.status === "COMPLETED"
  ).slice(0, MESSAGE_THREADS.length);

  for (let i = 0; i < bookingsForMessages.length; i++) {
    const b = bookingsForMessages[i]!;
    const thread = MESSAGE_THREADS[i]!;

    try {
      const conversation = await prisma.conversation.create({
        data: { bookingId: b.id },
      });

      for (let j = 0; j < thread.length; j++) {
        const msg = thread[j]!;
        const senderId = msg.fromClient ? clientIds[b.clientIdx]! : providerUserIds[b.providerIdx]!;
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            content: msg.content,
            isRead: j < thread.length - 1,
            readAt: j < thread.length - 1 ? daysAgo(Math.max(0, 5 - j)) : null,
            createdAt: new Date(daysAgo(10).getTime() + j * 45 * 60 * 1000),
          },
        });
        messageCount++;
      }
    } catch {
      // Skip if conversation already exists for this booking
    }
  }
  console.log(`  -> ${messageCount} messages in ${bookingsForMessages.length} conversations`);

  // ----------------------------------------------------------
  // 11. NOTIFICATIONS
  // ----------------------------------------------------------
  console.log("Seeding notifications...");

  const notificationTemplates: { userId: string; type: "BOOKING_REQUEST" | "BOOKING_ACCEPTED" | "BOOKING_COMPLETED" | "PAYMENT_RECEIVED" | "REVIEW_RECEIVED" | "KYC_APPROVED" | "NEW_MESSAGE" | "SYSTEM"; title: string; body: string }[] = [
    { userId: clientIds[0]!, type: "BOOKING_ACCEPTED", title: "Reservation acceptee", body: "Ahmed Plomberie a accepte votre reservation pour le 15 fevrier." },
    { userId: clientIds[0]!, type: "BOOKING_COMPLETED", title: "Service termine", body: "Votre reservation avec Ahmed Plomberie est terminee. N'oubliez pas de laisser un avis !" },
    { userId: clientIds[0]!, type: "NEW_MESSAGE", title: "Nouveau message", body: "Ahmed Plomberie vous a envoye un message." },
    { userId: clientIds[1]!, type: "BOOKING_ACCEPTED", title: "Reservation acceptee", body: "Fatma Nettoyage Pro a accepte votre demande de menage." },
    { userId: clientIds[2]!, type: "PAYMENT_RECEIVED", title: "Paiement confirme", body: "Votre paiement de 55.00 TND a ete confirme." },
    { userId: providerUserIds[0]!, type: "BOOKING_REQUEST", title: "Nouvelle demande", body: "Salma Mejri souhaite reserver votre service de plomberie." },
    { userId: providerUserIds[0]!, type: "REVIEW_RECEIVED", title: "Nouvel avis", body: "Salma Mejri vous a donne 5 etoiles ! Bravo !" },
    { userId: providerUserIds[0]!, type: "PAYMENT_RECEIVED", title: "Paiement recu", body: "39.60 TND ont ete credites sur votre compte Tawa." },
    { userId: providerUserIds[1]!, type: "BOOKING_REQUEST", title: "Nouvelle demande", body: "Mohamed Lahmar souhaite un menage complet de son appartement." },
    { userId: providerUserIds[2]!, type: "KYC_APPROVED", title: "KYC approuve", body: "Felicitations ! Votre identite a ete verifiee. Vous pouvez maintenant recevoir des reservations." },
    { userId: admin.id, type: "SYSTEM", title: "Nouveau prestataire", body: "Yassine Chaabane a soumis ses documents KYC. Verification en attente." },
    { userId: admin.id, type: "SYSTEM", title: "Signalement recu", body: "Un nouveau signalement a ete soumis et necessite votre attention." },
  ];

  for (const notif of notificationTemplates) {
    await prisma.notification.create({
      data: {
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        read: Math.random() > 0.4,
        readAt: Math.random() > 0.4 ? daysAgo(Math.floor(Math.random() * 5)) : null,
        createdAt: randomDate(daysAgo(15), new Date()),
      },
    });
  }
  console.log(`  -> ${notificationTemplates.length} notifications seeded`);

  // ----------------------------------------------------------
  // 12. QUOTES (a few for SUR_DEVIS services)
  // ----------------------------------------------------------
  console.log("Seeding quotes...");
  const surDevisServices = SERVICE_TEMPLATES.filter(s => s.pricingType === "SUR_DEVIS");

  for (let i = 0; i < Math.min(5, surDevisServices.length); i++) {
    const tmpl = surDevisServices[i]!;
    const catId = categoryMap[tmpl.categorySlug];
    if (!catId) continue;

    const svc = await prisma.service.findFirst({ where: { categoryId: catId, pricingType: "SUR_DEVIS" } });
    if (!svc) continue;

    const statuses: ("PENDING" | "RESPONDED" | "ACCEPTED" | "EXPIRED")[] = ["PENDING", "RESPONDED", "ACCEPTED", "EXPIRED", "PENDING"];
    const status = statuses[i]!;

    await prisma.quote.create({
      data: {
        clientId: clientIds[(i + 5) % clientIds.length]!,
        serviceId: svc.id,
        status,
        description: `Besoin de ${tmpl.title.toLowerCase()} pour mon domicile. Merci de me faire un devis detaille.`,
        address: `Rue ${10 + i}, La Marsa`,
        city: "La Marsa",
        preferredDate: daysFromNow(7 + i * 3),
        budget: 200 + i * 100,
        proposedPrice: status === "RESPONDED" || status === "ACCEPTED" ? 250 + i * 80 : null,
        proposedDelay: status === "RESPONDED" || status === "ACCEPTED" ? "3 a 5 jours ouvrables" : null,
        expiresAt: status === "EXPIRED" ? daysAgo(2) : daysFromNow(2),
        respondedAt: status === "RESPONDED" || status === "ACCEPTED" ? daysAgo(3) : null,
        acceptedAt: status === "ACCEPTED" ? daysAgo(1) : null,
      },
    });
  }
  console.log("  -> 5 quotes seeded");

  // ----------------------------------------------------------
  // 13. REPORTS
  // ----------------------------------------------------------
  console.log("Seeding reports...");
  await prisma.report.create({
    data: {
      reporterId: clientIds[3]!,
      reportedId: providerUserIds[11]!,
      type: "USER",
      reason: "Prestataire ne s'est pas presente au rendez-vous",
      description: "J'avais reserve un service de plomberie pour 10h. Le prestataire n'est jamais venu et n'a pas repondu aux messages.",
      priority: "IMPORTANT",
      status: "OPEN",
      slaDeadline: daysFromNow(1),
    },
  });

  await prisma.report.create({
    data: {
      reporterId: clientIds[5]!,
      type: "SERVICE",
      reason: "Description trompeuse du service",
      description: "Le tarif affiche ne correspond pas au prix demande lors de l'intervention. 45 DT annonce, 120 DT facture.",
      priority: "MINOR",
      status: "INVESTIGATING",
    },
  });

  await prisma.report.create({
    data: {
      reporterId: providerUserIds[2]!,
      reportedId: clientIds[7]!,
      type: "USER",
      reason: "Client irrespectueux",
      description: "Le client a ete tres impoli et agressif pendant l'intervention. Environnement de travail hostile.",
      priority: "MINOR",
      status: "OPEN",
    },
  });
  console.log("  -> 3 reports seeded");

  // ----------------------------------------------------------
  // 14. FAQ & LEGAL PAGES
  // ----------------------------------------------------------
  console.log("Seeding FAQs and legal pages...");

  const faqs = [
    { question: "Comment fonctionne Tawa Services ?", answer: "Tawa Services met en relation des clients avec des prestataires de services verifies en Tunisie. Recherchez un service, comparez les profils, reservez en ligne et payez en toute securite.", category: "general", sortOrder: 0 },
    { question: "Comment devenir prestataire ?", answer: "Inscrivez-vous en tant que prestataire, completez votre profil, soumettez vos documents KYC (CIN + selfie) et attendez la validation de notre equipe. Une fois approuve, vous pouvez publier vos services.", category: "provider", sortOrder: 1 },
    { question: "Quels sont les moyens de paiement acceptes ?", answer: "Nous acceptons les paiements par carte bancaire, D17 (Poste tunisienne), Flouci et especes. Le paiement est securise via notre systeme d'escrow.", category: "payment", sortOrder: 2 },
    { question: "Quelle est la commission Tawa ?", answer: "Tawa preleve une commission de 12% sur chaque transaction. Ce montant couvre les frais de plateforme, l'assurance et le service client.", category: "payment", sortOrder: 3 },
    { question: "Comment annuler une reservation ?", answer: "Vous pouvez annuler une reservation depuis votre espace client. Remboursement integral si l'annulation est faite plus de 48h avant le rendez-vous, 50% entre 24h et 48h.", category: "booking", sortOrder: 4 },
    { question: "Comment laisser un avis ?", answer: "Apres chaque prestation terminee, vous avez 10 jours pour laisser un avis. Les avis sont publies une fois que les deux parties ont donne leur evaluation.", category: "general", sortOrder: 5 },
  ];

  for (const faq of faqs) {
    await prisma.faq.create({ data: faq });
  }

  await prisma.legalPage.upsert({
    where: { slug: "cgu" },
    update: {},
    create: {
      slug: "cgu",
      title: "Conditions Generales d'Utilisation",
      content: "Les presentes Conditions Generales d'Utilisation regissent l'utilisation de la plateforme Tawa Services. En utilisant nos services, vous acceptez ces conditions dans leur integralite...",
      updatedBy: admin.id,
    },
  });

  await prisma.legalPage.upsert({
    where: { slug: "privacy" },
    update: {},
    create: {
      slug: "privacy",
      title: "Politique de Confidentialite",
      content: "Tawa Services s'engage a proteger vos donnees personnelles conformement a la legislation tunisienne en vigueur. Cette politique explique comment nous collectons et utilisons vos informations...",
      updatedBy: admin.id,
    },
  });
  console.log("  -> FAQs and legal pages seeded");

  // ----------------------------------------------------------
  // 15. BANNERS
  // ----------------------------------------------------------
  console.log("Seeding banners...");
  await prisma.banner.create({
    data: {
      title: "Bienvenue sur Tawa Services !",
      subtitle: "Trouvez le bon prestataire pres de chez vous en quelques clics.",
      position: "homepage",
      isActive: true,
      sortOrder: 0,
    },
  });
  console.log("  -> 1 banner seeded");

  // ----------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------
  console.log("\n========================================");
  console.log("SEED COMPLETE!");
  console.log("========================================");
  console.log(`Admin:      ${ADMIN_USER.email} / ${PASSWORD}`);
  console.log(`Clients:    ${CLIENTS_DATA.length} users (${CLIENTS_DATA[0]!.email} / ${PASSWORD})`);
  console.log(`Providers:  ${PROVIDERS_DATA.length} users (${PROVIDERS_DATA[0]!.email} / ${PASSWORD})`);
  console.log(`Services:   ${serviceIds.length}`);
  console.log(`Bookings:   ${bookingIds.length} + 1 demo`);
  console.log(`Reviews:    ${reviewCount} + 1 demo (5 stars)`);
  console.log(`Messages:   ${messageCount} + 8 demo`);
  console.log("========================================");
  console.log("\nDemo scenario:");
  console.log("Salma (salma.client@tawa.tn) cherche un plombier a La Marsa");
  console.log("-> trouve Ahmed (ahmed.plombier@tawa.tn)");
  console.log("-> reserve le service de reparation fuite");
  console.log("-> Ahmed accepte -> service termine");
  console.log("-> Salma note 5 etoiles");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
