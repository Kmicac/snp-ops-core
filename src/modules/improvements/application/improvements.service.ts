import { Injectable } from "@nestjs/common";
import {
  AuditActionType,
  AuditEntityType,
  ImprovementStatus,
  ImprovementType,
} from "@prisma/client";
import { ImprovementsRepository } from "../infrastructure/improvements.repo";
import { AuditRepo } from "../../audit/infrastructure/audit.repo";

@Injectable()
export class ImprovementsService {
  constructor(
    private readonly repo: ImprovementsRepository,
    private readonly audit: AuditRepo,
  ) {}

  async createImprovement(args: {
    organizationId: string;
    eventId?: string;
    incidentId?: string;
    createdById?: string | null;
    title: string;
    description: string;
    type: ImprovementType;
    priority?: number;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const improvement = await this.repo.create({
      organizationId: args.organizationId,
      eventId: args.eventId,
      incidentId: args.incidentId,
      createdById: args.createdById ?? null,
      title: args.title,
      description: args.description,
      type: args.type,
      priority: args.priority,
    });

    await this.audit.createLog({
      organizationId: args.organizationId,
      eventId: args.eventId ?? null,
      userId: args.createdById ?? null,
      entityType: AuditEntityType.IMPROVEMENT,
      entityId: improvement.id,
      action: AuditActionType.CREATED,
      message: `Improvement created: ${improvement.title}`,
      changes: {
        title: improvement.title,
        type: improvement.type,
        priority: improvement.priority,
      },
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    });

    return improvement;
  }

  listImprovements(args: {
    organizationId: string;
    eventId?: string;
    status?: ImprovementStatus;
    type?: ImprovementType;
  }) {
    return this.repo.listByOrgAndEvent(args);
  }

  async updateStatus(args: {
    organizationId: string;
    improvementId: string;
    nextStatus: ImprovementStatus;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const updated = await this.repo.updateStatus({
      improvementId: args.improvementId,
      nextStatus: args.nextStatus,
    });

    await this.audit.createLog({
      organizationId: args.organizationId,
      eventId: updated.eventId ?? null,
      userId: args.performedByUserId ?? null,
      entityType: AuditEntityType.IMPROVEMENT,
      entityId: updated.id,
      action: AuditActionType.STATUS_CHANGED,
      message: `Improvement status changed to ${updated.status}`,
      changes: {
        status: updated.status,
      },
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    });

    return updated;
  }
}
