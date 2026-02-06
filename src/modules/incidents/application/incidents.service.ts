import { Injectable } from "@nestjs/common";
import {
  AuditActionType,
  AuditEntityType,
  IncidentSeverity,
  IncidentStatus,
} from "@prisma/client";
import { IncidentsRepository } from "../infrastructure/incidents.repo";
import { AuditRepo } from "../../audit/infrastructure/audit.repo";

@Injectable()
export class IncidentsService {
  constructor(
    private readonly repo: IncidentsRepository,
    private readonly audit: AuditRepo,
  ) {}

  async createIncident(args: {
    organizationId: string;
    eventId: string;
    zoneId?: string;
    title: string;
    description: string;
    severity: IncidentSeverity;
    occurredAt?: Date;
    reportedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const incident = await this.repo.createIncident({
      eventId: args.eventId,
      zoneId: args.zoneId,
      title: args.title,
      description: args.description,
      severity: args.severity,
      occurredAt: args.occurredAt,
      reportedById: args.reportedByUserId ?? null,
    });

    await this.audit.createLog({
      organizationId: args.organizationId,
      eventId: args.eventId,
      userId: args.reportedByUserId ?? null,
      entityType: AuditEntityType.INCIDENT, // asegúrate que exista en tu enum
      entityId: incident.id,
      action: AuditActionType.CREATED, // idem
      message: `Incident created: ${incident.title}`,
      changes: {
        title: incident.title,
        severity: incident.severity,
      },
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    });

    return incident;
  }

  listByEvent(args: {
    eventId: string;
    status?: IncidentStatus;
  }) {
    return this.repo.listByEvent(args.eventId, {
      status: args.status,
    });
  }

  async updateStatus(args: {
    organizationId: string;
    eventId: string;
    incidentId: string;
    nextStatus: IncidentStatus;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const before = await this.repo.getByIdOrThrow(args.incidentId);

    const updated = await this.repo.updateStatus({
      incidentId: args.incidentId,
      nextStatus: args.nextStatus,
    });

    await this.audit.createLog({
      organizationId: args.organizationId,
      eventId: args.eventId,
      userId: args.performedByUserId ?? null,
      entityType: AuditEntityType.INCIDENT,
      entityId: args.incidentId,
      action: AuditActionType.STATUS_CHANGED,
      message: `Incident status changed from ${before.status} to ${updated.status}`,
      changes: {
        beforeStatus: before.status,
        afterStatus: updated.status,
      },
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    });

    return updated;
  }

  async updateIncident(args: {
    organizationId: string;
    eventId: string;
    incidentId: string;
    data: {
      title?: string;
      description?: string;
      severity?: IncidentSeverity;
      occurredAt?: string | null;
      zoneId?: string | null;
    };
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    await this.repo.assertEventInOrg(args.eventId, args.organizationId);

    const current = await this.repo.getByIdOrThrow(args.incidentId);
    if (current.eventId !== args.eventId) {
      throw new Error("Incident not in event scope");
    }

    if (args.data.zoneId !== undefined && args.data.zoneId !== null) {
      await this.repo.assertZoneInEvent(args.data.zoneId, args.eventId);
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
    if (args.data.severity !== undefined) {
      patch.severity = args.data.severity;
      changes.severity = { before: current.severity, after: patch.severity };
    }
    if (args.data.occurredAt !== undefined) {
      patch.occurredAt = args.data.occurredAt ? new Date(args.data.occurredAt) : null;
      changes.occurredAt = { before: current.occurredAt, after: patch.occurredAt };
    }
    if (args.data.zoneId !== undefined) {
      patch.zoneId = args.data.zoneId ?? null;
      changes.zoneId = { before: current.zoneId, after: patch.zoneId };
    }

    const updated = await this.repo.updateIncident({
      incidentId: args.incidentId,
      data: patch,
    });

    await this.audit.createLog({
      organizationId: args.organizationId,
      eventId: args.eventId,
      userId: args.performedByUserId ?? null,
      entityType: AuditEntityType.INCIDENT,
      entityId: args.incidentId,
      action: AuditActionType.UPDATED,
      message: "Incident updated",
      changes,
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    });

    return updated;
  }

  async addEvidence(args: {
    organizationId: string;
    eventId: string;
    incidentId: string;
    type: string;
    url?: string;
    note?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const evidence = await this.repo.addEvidence({
      incidentId: args.incidentId,
      type: args.type,
      url: args.url,
      note: args.note,
    });

    await this.audit.createLog({
      organizationId: args.organizationId,
      eventId: args.eventId,
      userId: args.performedByUserId ?? null,
      entityType: AuditEntityType.INCIDENT,
      entityId: args.incidentId,
      action: AuditActionType.EVIDENCE_ADDED,
      message: `Incident evidence added: ${args.type}`,
      changes: {
        evidenceId: evidence.id,
        type: evidence.type,
      },
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    });

    return evidence;
  }
}
