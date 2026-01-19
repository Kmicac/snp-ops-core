import { Injectable } from "@nestjs/common";
import { AuditActionType, AuditEntityType } from "@prisma/client";
import { AuditRepo, AuditCreateParams } from "../infrastructure/audit.repo";

@Injectable()
export class AuditService {
  constructor(private readonly repo: AuditRepo) {}

  log(params: AuditCreateParams) {
    return this.repo.createLog(params);
  }

  logWorkOrderStatusChange(params: {
    organizationId: string;
    eventId: string;
    workOrderId: string;
    fromStatus: string;
    toStatus: string;
    userId?: string | null;
    note?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    return this.repo.createLog({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.userId ?? null,
      entityType: AuditEntityType.WORK_ORDER,
      entityId: params.workOrderId,
      action: AuditActionType.STATUS_CHANGED,
      message:
        `Status: ${params.fromStatus} -> ${params.toStatus}` +
        (params.note ? ` | ${params.note}` : ""),
      changes: {
        from: params.fromStatus,
        to: params.toStatus,
        note: params.note ?? null,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });
  }

  listByEvent(organizationId: string, eventId: string, limit = 100) {
    return this.repo.listByEvent(organizationId, eventId, limit);
  }
}
