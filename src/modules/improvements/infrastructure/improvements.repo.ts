import { Injectable } from "@nestjs/common";
import {
  ImprovementStatus,
  ImprovementType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Injectable()
export class ImprovementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    organizationId: string;
    eventId?: string | null;
    incidentId?: string | null;
    createdById?: string | null;
    title: string;
    description: string;
    type: ImprovementType;
    priority?: number | null;
  }) {
    return this.prisma.improvement.create({
      data: {
        organizationId: data.organizationId,
        eventId: data.eventId ?? null,
        incidentId: data.incidentId ?? null,
        createdById: data.createdById ?? null,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority ?? null,
      },
    });
  }

  listByOrgAndEvent(args: {
    organizationId: string;
    eventId?: string;
    status?: ImprovementStatus;
    type?: ImprovementType;
  }) {
    const where: Prisma.ImprovementWhereInput = {
      organizationId: args.organizationId,
      ...(args.eventId ? { eventId: args.eventId } : {}),
      ...(args.status ? { status: args.status } : {}),
      ...(args.type ? { type: args.type } : {}),
    };

    return this.prisma.improvement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  updateStatus(args: {
    improvementId: string;
    nextStatus: ImprovementStatus;
  }) {
    return this.prisma.improvement.update({
      where: { id: args.improvementId },
      data: {
        status: args.nextStatus,
      },
    });
  }
}
