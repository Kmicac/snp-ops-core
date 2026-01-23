import { Injectable, NotFoundException } from "@nestjs/common";
import {
  IncidentSeverity,
  IncidentStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Injectable()
export class IncidentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createIncident(data: {
    eventId: string;
    zoneId?: string | null;
    reportedById?: string | null;
    title: string;
    description: string;
    severity: IncidentSeverity;
    occurredAt?: Date | null;
  }) {
    return this.prisma.incident.create({
      data: {
        eventId: data.eventId,
        zoneId: data.zoneId ?? null,
        reportedById: data.reportedById ?? null,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: IncidentStatus.OPEN,
        occurredAt: data.occurredAt ?? null,
      },
    });
  }

  async getByIdOrThrow(incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFoundException("Incident not found");
    }

    return incident;
  }

  listByEvent(eventId: string, params?: { status?: IncidentStatus }) {
    const where: Prisma.IncidentWhereInput = {
      eventId,
      ...(params?.status ? { status: params.status } : {}),
    };

    return this.prisma.incident.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        zone: true,
        reportedBy: true,
      },
    });
  }

  async updateStatus(args: {
    incidentId: string;
    nextStatus: IncidentStatus;
  }) {
    const resolvedAt =
      args.nextStatus === IncidentStatus.RESOLVED ||
      args.nextStatus === IncidentStatus.CLOSED
        ? new Date()
        : null;

    return this.prisma.incident.update({
      where: { id: args.incidentId },
      data: {
        status: args.nextStatus,
        resolvedAt,
      },
    });
  }

  addEvidence(data: {
    incidentId: string;
    type: string;
    url?: string | null;
    note?: string | null;
  }) {
    return this.prisma.incidentEvidence.create({
      data: {
        incidentId: data.incidentId,
        type: data.type,
        url: data.url ?? null,
        note: data.note ?? null,
      },
    });
  }
}
