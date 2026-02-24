import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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
// MAIN
// ============================================================

async function main() {
  console.log("Seeding gouvernorats & delegations...");

  for (const gov of GOUVERNORATS_DATA) {
    const created = await prisma.gouvernorat.upsert({
      where: { name: gov.name },
      update: {},
      create: {
        name: gov.name,
        code: gov.code,
      },
    });

    for (const delName of gov.delegations) {
      await prisma.delegation.upsert({
        where: {
          name_gouvernoratId: { name: delName, gouvernoratId: created.id },
        },
        update: {},
        create: {
          name: delName,
          gouvernoratId: created.id,
        },
      });
    }
  }

  console.log(`  ✓ ${GOUVERNORATS_DATA.length} gouvernorats seeded`);

  console.log("Seeding service categories...");

  for (let i = 0; i < CATEGORIES_DATA.length; i++) {
    const cat = CATEGORIES_DATA[i]!;
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        sortOrder: i,
      },
    });

    for (let j = 0; j < cat.children.length; j++) {
      const child = cat.children[j]!;
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {},
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          sortOrder: j,
        },
      });
    }
  }

  console.log(`  ✓ ${CATEGORIES_DATA.length} parent categories seeded`);
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
