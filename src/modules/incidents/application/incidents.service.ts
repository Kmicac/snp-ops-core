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
