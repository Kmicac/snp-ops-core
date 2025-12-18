import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';

type SortOrder = 'asc' | 'desc';

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

type EventWithVenue = EventRecord & { venue: VenueRecord | null };

type ZoneRecord = {
  id: string;
  eventId: string;
  name: string;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type EventCreateArgs = {
  data: {
    organizationId: string;
    code: string;
    name: string;
    startDate: Date | null;
    endDate: Date | null;
    venueId: string | null;
  };
  include: { venue: true };
};

type EventListArgs = {
  where: { organizationId: string };
  orderBy: Array<{ startDate: SortOrder } | { createdAt: SortOrder }>;
  include: { venue: true };
};

type EventGetArgs = {
  where: { id: string; organizationId: string };
  include: { venue: true };
};

type ZoneCreateArgs = {
  data: { eventId: string; name: string; type: string | null };
};

type ZoneListArgs = {
  where: { eventId: string };
  orderBy: Array<{ name: SortOrder }>;
};

type EventsPrismaClient = {
  event: {
    create(args: EventCreateArgs): Promise<EventWithVenue>;
    findMany(args: EventListArgs): Promise<EventWithVenue[]>;
    findFirstOrThrow(args: EventGetArgs): Promise<EventWithVenue>;
  };
  zone: {
    create(args: ZoneCreateArgs): Promise<ZoneRecord>;
    findMany(args: ZoneListArgs): Promise<ZoneRecord[]>;
  };
};

@Injectable()
export class EventsRepo {
  constructor(
    @Inject(PrismaService) private readonly prisma: EventsPrismaClient,
  ) {}

  createEvent(params: {
    organizationId: string;
    code: string;
    name: string;
    startDate?: Date;
    endDate?: Date;
    venueId?: string;
  }): Promise<EventWithVenue> {
    return this.prisma.event.create({
      data: {
        organizationId: params.organizationId,
        code: params.code,
        name: params.name,
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
        venueId: params.venueId ?? null,
      },
      include: { venue: true },
    });
  }

  listEvents(organizationId: string): Promise<EventWithVenue[]> {
    return this.prisma.event.findMany({
      where: { organizationId },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      include: { venue: true },
    });
  }

  getEventOrThrow(
    eventId: string,
    organizationId: string,
  ): Promise<EventWithVenue> {
    return this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      include: { venue: true },
    });
  }

  createZone(params: {
    eventId: string;
    name: string;
    type?: string;
  }): Promise<ZoneRecord> {
    return this.prisma.zone.create({
      data: {
        eventId: params.eventId,
        name: params.name,
        type: params.type ?? null,
      },
    });
  }

  listZones(eventId: string): Promise<ZoneRecord[]> {
    return this.prisma.zone.findMany({
      where: { eventId },
      orderBy: [{ name: 'asc' }],
    });
  }
}
