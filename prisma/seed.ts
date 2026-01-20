import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Check your .env");
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const prisma = createPrisma();

async function main() {
  const orgName = "Santo Negro Producciones";
  const eventCode = "ADCC_LATAM_2025";

  const org = await prisma.organization.upsert({
    where: { id: "org_snp" },
    update: { name: orgName },
    create: { id: "org_snp", name: orgName },
  });

  const venue = await prisma.venue.upsert({
    where: { id: "venue_parque_olimpico" },
    update: {
      name: "Parque Olímpico de la Juventud",
      city: "Buenos Aires",
      country: "Argentina",
    },
    create: {
      id: "venue_parque_olimpico",
      name: "Parque Olímpico de la Juventud",
      city: "Buenos Aires",
      country: "Argentina",
    },
  });

  const event = await prisma.event.upsert({
    where: { code: eventCode },
    update: {
      name: "ADCC LATINOAMÉRICA 2025",
      startDate: new Date("2025-12-13T00:00:00.000Z"),
      endDate: new Date("2025-12-13T23:59:59.000Z"),
      organizationId: org.id,
      venueId: venue.id,
    },
    create: {
      code: eventCode,
      name: "ADCC LATINOAMÉRICA 2025",
      startDate: new Date("2025-12-13T00:00:00.000Z"),
      endDate: new Date("2025-12-13T23:59:59.000Z"),
      organizationId: org.id,
      venueId: venue.id,
    },
  });

  const zones = [
    { name: "Accesos", type: "ACCESS" },
    { name: "Tatamis", type: "SPORT" },
    { name: "Backstage", type: "BACKSTAGE" },
    { name: "Docks / Carga y Descarga", type: "LOGISTICS" },
  ];

  for (const z of zones) {
    await prisma.zone.upsert({
      where: { id: `${event.id}_${z.type}` },
      update: { name: z.name, type: z.type, eventId: event.id },
      create: {
        id: `${event.id}_${z.type}`,
        name: z.name,
        type: z.type,
        eventId: event.id,
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPlainPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!adminEmail || !adminPlainPassword) {
    throw new Error(
      "ADMIN_EMAIL y ADMIN_INITIAL_PASSWORD son obligatorias para crear el SUPER_ADMIN (defínelas en .env)",
    );
  }

  const passwordHash = await bcrypt.hash(adminPlainPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      fullName: "Administrador SNP",
      isActive: true,
    },
  });

  await prisma.orgMembership.upsert({
    where: {
      organizationId_userId_role: {
        organizationId: org.id,
        userId: adminUser.id,
        role: "SUPER_ADMIN",
      },
    },
    update: {},
    create: {
      organizationId: org.id,
      userId: adminUser.id,
      role: "SUPER_ADMIN",
    },
  });

  console.log("Seed OK:", {
    org: org.id,
    event: event.id,
    venue: venue.id,
    superAdminEmail: adminEmail,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
