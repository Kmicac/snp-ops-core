import { PrismaClient } from '@prisma/client';

type OrganizationRecord = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type VenueRecord = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventRecord = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  venueId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ZoneRecord = {
  id: string;
  eventId: string;
  name: string;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationUpsertArgs = {
  where: { id: string };
  update: { name: string };
  create: { id: string; name: string };
};

type VenueUpsertArgs = {
  where: { id: string };
  update: { name: string; city: string; country: string };
  create: { id: string; name: string; city: string; country: string };
};

type EventUpsertArgs = {
  where: { code: string };
  update: {
    name: string;
    startDate: Date;
    endDate: Date;
    organizationId: string;
    venueId: string;
  };
  create: {
    code: string;
    name: string;
    startDate: Date;
    endDate: Date;
    organizationId: string;
    venueId: string;
  };
};

type ZoneUpsertArgs = {
  where: { id: string };
  update: { name: string; type: string | null; eventId: string };
  create: { id: string; name: string; type: string | null; eventId: string };
};

type SeedPrismaClient = {
  organization: {
    upsert(args: OrganizationUpsertArgs): Promise<OrganizationRecord>;
  };
  venue: { upsert(args: VenueUpsertArgs): Promise<VenueRecord> };
  event: { upsert(args: EventUpsertArgs): Promise<EventRecord> };
  zone: { upsert(args: ZoneUpsertArgs): Promise<ZoneRecord> };
  $disconnect(): Promise<void>;
};

const PrismaClientCtor = PrismaClient as unknown as new () => SeedPrismaClient;
const prisma = new PrismaClientCtor();

async function main() {
  const orgName = 'Santonegro Producciones';
  const eventCode = 'ADCC_LATAM_2025';

  const org = await prisma.organization.upsert({
    where: { id: 'org_snp' },
    update: { name: orgName },
    create: { id: 'org_snp', name: orgName },
  });

  const venue = await prisma.venue.upsert({
    where: { id: 'venue_parque_olimpico' },
    update: {
      name: 'Parque Olímpico de la Juventud',
      city: 'Buenos Aires',
      country: 'Argentina',
    },
    create: {
      id: 'venue_parque_olimpico',
      name: 'Parque Olímpico de la Juventud',
      city: 'Buenos Aires',
      country: 'Argentina',
    },
  });

  const event = await prisma.event.upsert({
    where: { code: eventCode },
    update: {
      name: 'ADCC LATINOAMÉRICA 2025',
      startDate: new Date('2025-12-13T00:00:00.000Z'),
      endDate: new Date('2025-12-13T23:59:59.000Z'),
      organizationId: org.id,
      venueId: venue.id,
    },
    create: {
      code: eventCode,
      name: 'ADCC LATINOAMÉRICA 2025',
      startDate: new Date('2025-12-13T00:00:00.000Z'),
      endDate: new Date('2025-12-13T23:59:59.000Z'),
      organizationId: org.id,
      venueId: venue.id,
    },
  });

  const zones = [
    { name: 'Accesos', type: 'ACCESS' },
    { name: 'Tatamis', type: 'SPORT' },
    { name: 'Backstage', type: 'BACKSTAGE' },
    { name: 'Docks / Carga y Descarga', type: 'LOGISTICS' },
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

  console.log('Seed OK:', { org: org.id, event: event.id, venue: venue.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
