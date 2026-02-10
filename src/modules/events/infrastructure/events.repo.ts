import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";

const eventIncludeWithMetrics = Prisma.validator<Prisma.EventInclude>()({
  venueRef: true,
  resources: {
    select: {
      staffMemberId: true,
      assetId: true,
    },
  },
  _count: {
    select: {
      workOrders: true,
      incidents: true,
      sponsorships: true,
    },
  },
});

export type EventWithMetrics = Prisma.EventGetPayload<{
  include: typeof eventIncludeWithMetrics;
}>;

@Injectable()
export class EventsRepo {
  constructor(private readonly prisma: PrismaService) {}

  createEvent(params: {
    organizationId: string;
    code: string;
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    venue?: string;
    venueId?: string;
    imageUrl?: string;
    imageKey?: string;
  }): Promise<EventWithMetrics> {
    return this.prisma.event.create({
      data: {
        organizationId: params.organizationId,
        code: params.code,
        name: params.name,
        description: params.description ?? null,
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
        venue: params.venue ?? null,
        venueId: params.venueId ?? null,
        imageUrl: params.imageUrl ?? null,
        imageKey: params.imageKey ?? null,
      },
      include: eventIncludeWithMetrics,
    });
  }

  listEvents(organizationId: string): Promise<EventWithMetrics[]> {
    return this.prisma.event.findMany({
      where: { organizationId },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: eventIncludeWithMetrics,
    });
  }

  getEventOrThrow(eventId: string, organizationId: string): Promise<EventWithMetrics> {
    return this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      include: eventIncludeWithMetrics,
    });
  }

  updateEvent(params: {
    eventId: string;
    data: Prisma.EventUncheckedUpdateInput;
  }): Promise<EventWithMetrics> {
    return this.prisma.event.update({
      where: { id: params.eventId },
      data: params.data,
      include: eventIncludeWithMetrics,
    });
  }

  createZone(params: {
    eventId: string;
    name: string;
    type?: string;
  }) {
    return this.prisma.zone.create({
      data: {
        eventId: params.eventId,
        name: params.name,
        type: params.type ?? null,
      },
    });
  }

  listZones(eventId: string) {
    return this.prisma.zone.findMany({
      where: { eventId },
      orderBy: [{ name: "asc" }],
    });
  }

  async replaceEventResources(params: {
    organizationId: string;
    eventId: string;
    staffIds: string[];
    assetIds: string[];
  }) {
    const staffIds = [...new Set(params.staffIds)];
    const assetIds = [...new Set(params.assetIds)];

    if (staffIds.length > 0) {
      const foundStaff = await this.prisma.staffMember.count({
        where: {
          organizationId: params.organizationId,
          id: { in: staffIds },
        },
      });
      if (foundStaff !== staffIds.length) {
        throw new BadRequestException("Some staffIds do not belong to this organization");
      }
    }

    if (assetIds.length > 0) {
      const foundAssets = await this.prisma.asset.count({
        where: {
          organizationId: params.organizationId,
          id: { in: assetIds },
        },
      });
      if (foundAssets !== assetIds.length) {
        throw new BadRequestException("Some assetIds do not belong to this organization");
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.eventResource.deleteMany({
        where: {
          organizationId: params.organizationId,
          eventId: params.eventId,
        },
      });

      if (staffIds.length > 0) {
        await tx.eventResource.createMany({
          data: staffIds.map((staffId) => ({
            organizationId: params.organizationId,
            eventId: params.eventId,
            staffMemberId: staffId,
          })),
          skipDuplicates: true,
        });
      }

      if (assetIds.length > 0) {
        await tx.eventResource.createMany({
          data: assetIds.map((assetId) => ({
            organizationId: params.organizationId,
            eventId: params.eventId,
            assetId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.getEventResources({
      organizationId: params.organizationId,
      eventId: params.eventId,
    });
  }

  async getEventResources(params: { organizationId: string; eventId: string }) {
    const rows = await this.prisma.eventResource.findMany({
      where: {
        organizationId: params.organizationId,
        eventId: params.eventId,
      },
      select: {
        staffMemberId: true,
        assetId: true,
      },
    });

    return {
      staffIds: [...new Set(rows.map((row) => row.staffMemberId).filter(Boolean))] as string[],
      assetIds: [...new Set(rows.map((row) => row.assetId).filter(Boolean))] as string[],
    };
  }
}
