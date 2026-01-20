import { PrismaService } from "src/shared/prisma/prisma.service";
import { IncidentSeverity, IncidentType } from "../domain/incident.types";


export class IncidentsRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(data: {
    organizationId: string;
    eventId: string;
    type: IncidentType;
    severity: IncidentSeverity;
    title: string;
    description: string;
    createdById: string;
  }) {
    return this.prisma.incident.create({
      data,
    });
  }

  findByEvent(eventId: string) {
    return this.prisma.incident.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  }
}
