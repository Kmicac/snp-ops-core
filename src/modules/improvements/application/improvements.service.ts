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

  async updateImprovement(args: {
    organizationId: string;
    improvementId: string;
    data: {
      title?: string;
      description?: string;
      type?: ImprovementType;
      priority?: number | null;
      eventId?: string | null;
      incidentId?: string | null;
    };
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const current = await this.repo.getByIdOrThrow(
      args.improvementId,
      args.organizationId,
    );

    if (args.data.eventId !== undefined && args.data.eventId !== null) {
      await this.repo.assertEventInOrg(args.data.eventId, args.organizationId);
    }
    if (args.data.incidentId !== undefined && args.data.incidentId !== null) {
      await this.repo.assertIncidentInOrg(args.data.incidentId, args.organizationId);
    }

    const patch: Record<string, any> = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    if (args.data.title !== undefined) {
      patch.title = args.data.title.trim();
      changes.title = { before: current.title, after: patch.title };
    }
    if (args.data.description !== undefined) {
      patch.description = args.data.description.trim();
      changes.description = { before: current.description, after: patch.description };
    }
    if (args.data.type !== undefined) {
      patch.type = args.data.type;
      changes.type = { before: current.type, after: patch.type };
    }
    if (args.data.priority !== undefined) {
      patch.priority = args.data.priority ?? null;
      changes.priority = { before: current.priority, after: patch.priority };
    }
    if (args.data.eventId !== undefined) {
      patch.eventId = args.data.eventId ?? null;
      changes.eventId = { before: current.eventId, after: patch.eventId };
    }
    if (args.data.incidentId !== undefined) {
      patch.incidentId = args.data.incidentId ?? null;
      changes.incidentId = { before: current.incidentId, after: patch.incidentId };
    }

    const updated = await this.repo.updateImprovement({
      improvementId: args.improvementId,
      data: patch,
    });

    await this.audit.createLog({
      organizationId: args.organizationId,
      eventId: updated.eventId ?? null,
      userId: args.performedByUserId ?? null,
      entityType: AuditEntityType.IMPROVEMENT,
      entityId: updated.id,
      action: AuditActionType.UPDATED,
      message: "Improvement updated",
      changes,
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    });

    return updated;
  }
}
