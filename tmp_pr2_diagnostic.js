const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

function loadEnvFromDotEnv() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFromDotEnv();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const ORG_ID = 'org_snp';

const SEED_EVENT_CODES = [
  'OPEN_ADCC_BUENOS_AIRES_2026',
  'AJP_TOUR_NACIONAL_SANTIAGO_2026',
  'OPEN_ADCC_CARACAS_2026',
  'OPEN_ADCC_SANTIAGO_2026',
  'SANTO_NEGRO_SERIES_CORDOBA_2026',
  'OPEN_ADCC_BOGOTA_2026',
  'AJP_TOUR_NACIONAL_ARGENTINA_2026',
  'ADCC_WORLD_CHAMPIONSHIP_2026',
  'OPEN_ADCC_GUAYAQUIL_2026',
  'OPEN_ADCC_LIMA_2026',
  'OPEN_ARGENTINA_GI_NO_GI_2026',
  'SOUTH_AMERICAN_ADCC_2026',
];

const SEED_CATEGORY_NAMES = [
  'Cámaras',
  'Lentes',
  'Audio',
  'Iluminación',
  'Trípodes & Rigging',
  'Video',
  'Networking',
  'Energía',
  'Cables & Adaptadores',
  'Computación',
  'Accesorios',
  'Cases & Transporte',
];

const SEED_ASSET_TAGS = [
  'CAM-001','CAM-002','CAM-003','CAM-004',
  'LEN-001','LEN-002','LEN-003','LEN-004',
  'AUD-001','AUD-002','AUD-003','AUD-004',
  'LGT-001','LGT-002','LGT-003','LGT-004',
  'RIG-001','RIG-002','RIG-003','RIG-004',
  'VID-001','VID-002','VID-003','VID-004',
  'NET-001','NET-002','NET-003','NET-004',
  'PWR-001','PWR-002','PWR-003','PWR-004',
  'CAB-001','CAB-002','CAB-003','CAB-004',
  'CPU-001','CPU-002','CPU-003','CPU-004',
  'ACC-001','ACC-002','ACC-003','ACC-004',
  'CAS-001','CAS-002','CAS-003','CAS-004',
];

const SEED_KIT_IDS = [
  'kit_seed_broadcast_core',
  'kit_seed_audio_interview',
  'kit_seed_operations_field',
];

const normalizeDate = (value) => (value ? value.toISOString() : null);

function splitByOwnership(records, detector) {
  const seedOwned = [];
  const userOrLegacy = [];

  for (const record of records) {
    if (detector(record)) {
      seedOwned.push(record);
    } else {
      userOrLegacy.push(record);
    }
  }

  return {
    total: records.length,
    seedOwned: {
      count: seedOwned.length,
      records: seedOwned,
    },
    userOrLegacy: {
      count: userOrLegacy.length,
      records: userOrLegacy,
    },
  };
}

async function main() {
  const events = await prisma.event.findMany({
    where: {
      organizationId: ORG_ID,
      code: { notIn: SEED_EVENT_CODES },
    },
    select: {
      id: true,
      code: true,
      name: true,
      createdAt: true,
      organizationId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const eventSummaries = events.map((event) => ({
    id: event.id,
    code: event.code,
    name: event.name,
    createdAt: normalizeDate(event.createdAt),
    organizationId: event.organizationId,
  }));

  const eventsReport = splitByOwnership(eventSummaries, (event) => {
    return event.code === 'ADCC_LATAM_2025' || event.code.startsWith('SEED_');
  });

  const categories = await prisma.assetCategory.findMany({
    where: {
      organizationId: ORG_ID,
      name: { notIn: SEED_CATEGORY_NAMES },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      organizationId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const categorySummaries = categories.map((category) => ({
    id: category.id,
    name: category.name,
    createdAt: normalizeDate(category.createdAt),
    organizationId: category.organizationId,
  }));

  const categoriesReport = splitByOwnership(categorySummaries, (category) => {
    return category.name.toLowerCase().startsWith('seed-');
  });

  const assets = await prisma.asset.findMany({
    where: {
      organizationId: ORG_ID,
      OR: [
        { assetTag: null },
        { assetTag: { notIn: SEED_ASSET_TAGS } },
      ],
    },
    select: {
      id: true,
      assetTag: true,
      name: true,
      createdAt: true,
      organizationId: true,
      category: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ categoryId: 'asc' }, { createdAt: 'asc' }],
  });

  const assetsByCategory = new Map();
  for (const asset of assets) {
    const categoryName = asset.category?.name ?? 'Sin categoría';
    if (!assetsByCategory.has(categoryName)) {
      assetsByCategory.set(categoryName, []);
    }

    assetsByCategory.get(categoryName).push({
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      createdAt: normalizeDate(asset.createdAt),
      organizationId: asset.organizationId,
    });
  }

  const assetsReport = {};
  for (const [categoryName, rows] of [...assetsByCategory.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    assetsReport[categoryName] = splitByOwnership(rows, (asset) => {
      return !!asset.assetTag && /^[A-Z]{3}-\d{3}$/.test(asset.assetTag);
    });
  }

  const kits = await prisma.inventoryKit.findMany({
    where: {
      organizationId: ORG_ID,
      id: { notIn: SEED_KIT_IDS },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      organizationId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const kitSummaries = kits.map((kit) => ({
    id: kit.id,
    name: kit.name,
    createdAt: normalizeDate(kit.createdAt),
    organizationId: kit.organizationId,
  }));

  const kitsReport = splitByOwnership(kitSummaries, (kit) => {
    return kit.id.startsWith('kit_seed_');
  });

  // PR-2 seed does not define StaffMembers, so every existing staff member is non-seed.
  const staffMembers = await prisma.staffMember.findMany({
    where: { organizationId: ORG_ID },
    select: {
      id: true,
      fullName: true,
      createdAt: true,
      organizationId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const staffSummaries = staffMembers.map((staff) => ({
    id: staff.id,
    fullName: staff.fullName,
    createdAt: normalizeDate(staff.createdAt),
    organizationId: staff.organizationId,
  }));

  const staffReport = splitByOwnership(staffSummaries, (staff) => {
    return staff.id.startsWith('staff_seed_') || staff.fullName.toLowerCase().includes('seed');
  });

  const report = {
    generatedAt: new Date().toISOString(),
    organizationId: ORG_ID,
    note: 'Read-only diagnostic report. No records were modified.',
    sections: {
      eventsNotInNewSeed: eventsReport,
      assetCategoriesNotInSeed: categoriesReport,
      assetsNotInSeedGroupedByCategory: assetsReport,
      inventoryKitsNotInSeed: kitsReport,
      staffMembersNotInSeed: staffReport,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
