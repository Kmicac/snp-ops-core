import { Injectable } from "@nestjs/common";
import { WorkOrderStatus } from "@prisma/client";
import { assertWorkOrderTransition } from "../domain/work-order.transitions";
import { WorkOrdersRepo } from "../infrastructure/work-orders.repo";

function computeDelayMinutes(scheduledEndAt: Date | null, completedAt: Date | null, now: Date) {
  if (!scheduledEndAt) return null;
  const end = scheduledEndAt.getTime();
  const reference = (completedAt ?? now).getTime();
  const diffMs = reference - end;
  return diffMs > 0 ? Math.round(diffMs / 60000) : 0;
}

@Injectable()
export class WorkOrdersService {
  constructor(private readonly repo: WorkOrdersRepo) {}

  async create(params: {
    organizationId: string;
    eventId: string;
    providerServiceId: string;
    title: string;
    description?: string;
    zoneId?: string;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    await this.repo.assertProviderServiceInEvent(params.providerServiceId, params.eventId);
    if (params.zoneId) await this.repo.assertZoneInEvent(params.zoneId, params.eventId);

    return this.repo.createWorkOrder({
      eventId: params.eventId,
      providerServiceId: params.providerServiceId,
      zoneId: params.zoneId,
      title: params.title.trim(),
      description: params.description?.trim(),
      scheduledStartAt: params.scheduledStartAt ? new Date(params.scheduledStartAt) : undefined,
      scheduledEndAt: params.scheduledEndAt ? new Date(params.scheduledEndAt) : undefined,
    });
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

    // hard-scope: que el WO sea del event
    if (wo.eventId !== params.eventId) {
      // evitamos filtrar ids entre eventos
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

    // Trazabilidad pro: siempre registramos el cambio
    await this.repo.addEvidence({
      workOrderId: current.id,
      type: "status_change",
      note: `Status: ${current.status} -> ${params.nextStatus}` + (params.note ? ` | ${params.note}` : ""),
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
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    const wo = await this.repo.getByIdOrThrow(params.workOrderId);
    if (wo.eventId !== params.eventId) throw new Error("Work order not in event scope");

    return this.repo.addEvidence({
      workOrderId: params.workOrderId,
      type: params.type,
      url: params.url,
      note: params.note,
    });
  }
}
