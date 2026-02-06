import { Injectable } from "@nestjs/common";
import { AuditActionType, AuditEntityType, WorkOrderStatus } from "@prisma/client";
import { assertWorkOrderTransition } from "../domain/work-order.transitions";
import { WorkOrdersRepo } from "../infrastructure/work-orders.repo";
import { AuditService } from "src/modules/audit/application/audit.service";

function computeDelayMinutes(scheduledEndAt: Date | null, completedAt: Date | null, now: Date) {
  if (!scheduledEndAt) return null;
  const end = scheduledEndAt.getTime();
  const reference = (completedAt ?? now).getTime();
  const diffMs = reference - end;
  return diffMs > 0 ? Math.round(diffMs / 60000) : 0;
}

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly repo: WorkOrdersRepo,
    private readonly audit: AuditService,
  ) { }

  async create(params: {
    organizationId: string;
    eventId: string;
    providerServiceId: string;
    title: string;
    description?: string;
    zoneId?: string;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    await this.repo.assertProviderServiceInEvent(params.providerServiceId, params.eventId);
    if (params.zoneId) await this.repo.assertZoneInEvent(params.zoneId, params.eventId);

    const created = await this.repo.createWorkOrder({
      eventId: params.eventId,
      providerServiceId: params.providerServiceId,
      zoneId: params.zoneId,
      title: params.title.trim(),
      description: params.description?.trim(),
      scheduledStartAt: params.scheduledStartAt ? new Date(params.scheduledStartAt) : undefined,
      scheduledEndAt: params.scheduledEndAt ? new Date(params.scheduledEndAt) : undefined,
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.WORK_ORDER,
      entityId: created.id,
      action: AuditActionType.CREATED,
      message: `Work order created: ${created.title}`,
      changes: {
        providerServiceId: created.providerServiceId,
        zoneId: created.zoneId,
        status: created.status,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return created;
  }

  async listByEvent(params: {
    organizationId: string;
    eventId: string;
    status?: WorkOrderStatus;
    zoneId?: string;
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    if (params.zoneId) await this.repo.assertZoneInEvent(params.zoneId, params.eventId);

    const items = await this.repo.listByEvent({
      eventId: params.eventId,
      status: params.status,
      zoneId: params.zoneId,
    });

    // Campo computado útil para UI/KPI (sin cambiar schema)
    const now = new Date();
    return items.map((wo) => ({
      ...wo,
      delayMinutes: computeDelayMinutes(wo.scheduledEndAt, wo.completedAt, now),
    }));
  }

  async get(params: { organizationId: string; eventId: string; workOrderId: string }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    const wo = await this.repo.getByIdOrThrow(params.workOrderId);

    if (wo.eventId !== params.eventId) {
      throw new Error("Work order not in event scope");
    }

    const now = new Date();
    return { ...wo, delayMinutes: computeDelayMinutes(wo.scheduledEndAt, wo.completedAt, now) };
  }

  async updateStatus(params: {
    organizationId: string;
    eventId: string;
    workOrderId: string;
    nextStatus: WorkOrderStatus;
    note?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    const current = await this.repo.getByIdOrThrow(params.workOrderId);
    if (current.eventId !== params.eventId) throw new Error("Work order not in event scope");

    assertWorkOrderTransition(current.status, params.nextStatus);

    const updated = await this.repo.updateStatus({
      id: current.id,
      status: params.nextStatus,
      now: new Date(),
    });

    await this.repo.addEvidence({
      workOrderId: current.id,
      type: "status_change",
      note:
        `Status: ${current.status} -> ${params.nextStatus}` +
        (params.note ? ` | ${params.note}` : ""),
    });

    await this.audit.logWorkOrderStatusChange({
      organizationId: params.organizationId,
      eventId: params.eventId,
      workOrderId: current.id,
      fromStatus: current.status,
      toStatus: params.nextStatus,
      userId: params.performedByUserId ?? null,
      note: params.note,
      ip: params.ip,
      userAgent: params.userAgent,
    });

    return updated;
  }

  async update(params: {
    organizationId: string;
    eventId: string;
    workOrderId: string;
    data: {
      title?: string;
      description?: string | null;
      zoneId?: string | null;
      providerServiceId?: string | null;
      scheduledStartAt?: string | null;
      scheduledEndAt?: string | null;
    };
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    const current = await this.repo.getByIdOrThrow(params.workOrderId);
    if (current.eventId !== params.eventId) {
      throw new Error("Work order not in event scope");
    }

    if (params.data.zoneId !== undefined && params.data.zoneId !== null) {
      await this.repo.assertZoneInEvent(params.data.zoneId, params.eventId);
    }
    if (params.data.providerServiceId !== undefined && params.data.providerServiceId !== null) {
      await this.repo.assertProviderServiceInEvent(params.data.providerServiceId, params.eventId);
    }

    const patch: Record<string, any> = {};
    const changes: Record<string, { before: unknown; after: unknown }> = {};

    if (params.data.title !== undefined) {
      patch.title = params.data.title.trim();
      changes.title = { before: current.title, after: patch.title };
    }
    if (params.data.description !== undefined) {
      patch.description = params.data.description?.trim() ?? null;
      changes.description = { before: current.description, after: patch.description };
    }
    if (params.data.zoneId !== undefined) {
      patch.zoneId = params.data.zoneId ?? null;
      changes.zoneId = { before: current.zoneId, after: patch.zoneId };
    }
    if (params.data.providerServiceId !== undefined) {
      patch.providerServiceId = params.data.providerServiceId ?? null;
      changes.providerServiceId = { before: current.providerServiceId, after: patch.providerServiceId };
    }
    if (params.data.scheduledStartAt !== undefined) {
      patch.scheduledStartAt = params.data.scheduledStartAt
        ? new Date(params.data.scheduledStartAt)
        : null;
      changes.scheduledStartAt = { before: current.scheduledStartAt, after: patch.scheduledStartAt };
    }
    if (params.data.scheduledEndAt !== undefined) {
      patch.scheduledEndAt = params.data.scheduledEndAt
        ? new Date(params.data.scheduledEndAt)
        : null;
      changes.scheduledEndAt = { before: current.scheduledEndAt, after: patch.scheduledEndAt };
    }

    const updated = await this.repo.updateWorkOrder({
      id: params.workOrderId,
      data: patch,
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.WORK_ORDER,
      entityId: updated.id,
      action: AuditActionType.UPDATED,
      message: "Work order updated",
      changes,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return updated;
  }


  async addEvidence(params: {
    organizationId: string;
    eventId: string;
    workOrderId: string;
    type: string;
    url?: string;
    note?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    const wo = await this.repo.getByIdOrThrow(params.workOrderId);
    if (wo.eventId !== params.eventId) throw new Error("Work order not in event scope");

    const evidence = await this.repo.addEvidence({
      workOrderId: params.workOrderId,
      type: params.type,
      url: params.url,
      note: params.note,
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.WORK_ORDER,
      entityId: params.workOrderId,
      action: AuditActionType.EVIDENCE_ADDED,
      message: `Work order evidence added: ${params.type}`,
      changes: {
        evidenceId: evidence.id,
        type: evidence.type,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return evidence;
  }
}
