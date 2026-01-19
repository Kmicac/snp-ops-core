import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { AuditActionType, AuditEntityType } from "@prisma/client";

export type AuditCreateParams = {
  organizationId?: string | null;
  eventId?: string | null;
  userId?: string | null;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditActionType;
  message?: string | null;
  changes?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class AuditRepo {
  constructor(private readonly prisma: PrismaService) {}

  createLog(params: AuditCreateParams) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId ?? null,
        eventId: params.eventId ?? null,
        userId: params.userId ?? null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        message: params.message ?? null,
        changes: params.changes ?? undefined,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }

  listByEvent(organizationId: string, eventId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { organizationId, eventId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: true },
    });
  }
}
