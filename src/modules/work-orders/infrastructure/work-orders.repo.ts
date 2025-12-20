import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { WorkOrderStatus } from "@prisma/client";

@Injectable()
export class WorkOrdersRepo {
  constructor(private readonly prisma: PrismaService) {}

  // scoping: validar que el event pertenece a la org
  async assertEventInOrg(eventId: string, organizationId: string) {
    await this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
  }

  async assertZoneInEvent(zoneId: string, eventId: string) {
    await this.prisma.zone.findFirstOrThrow({
      where: { id: zoneId, eventId },
      select: { id: true },
    });
  }

  async assertProviderServiceInEvent(providerServiceId: string, eventId: string) {
    await this.prisma.providerService.findFirstOrThrow({
      where: { id: providerServiceId, eventId },
      select: { id: true },
    });
  }

  createWorkOrder(params: {
    eventId: string;
    providerServiceId: string;
    zoneId?: string;
    title: string;
    description?: string;
    scheduledStartAt?: Date;
    scheduledEndAt?: Date;
  }) {
    return this.prisma.workOrder.create({
      data: {
        eventId: params.eventId,
        providerServiceId: params.providerServiceId,
        zoneId: params.zoneId ?? null,
        title: params.title,
        description: params.description ?? null,
        scheduledStartAt: params.scheduledStartAt ?? null,
        scheduledEndAt: params.scheduledEndAt ?? null,
      },
      include: {
        providerService: { include: { provider: true } },
        zone: true,
        evidences: true,
      },
    });
  }

  listByEvent(params: { eventId: string; status?: WorkOrderStatus; zoneId?: string }) {
    return this.prisma.workOrder.findMany({
      where: {
        eventId: params.eventId,
        ...(params.status ? { status: params.status } : {}),
        ...(params.zoneId ? { zoneId: params.zoneId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      include: {
        providerService: { include: { provider: true } },
        zone: true,
      },
    });
  }

  getByIdOrThrow(id: string) {
    return this.prisma.workOrder.findFirstOrThrow({
      where: { id },
      include: {
        providerService: { include: { provider: true } },
        zone: true,
        evidences: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  updateStatus(params: { id: string; status: WorkOrderStatus; now: Date }) {
    const patch: Record<string, any> = { status: params.status };

    if (params.status === "ACCEPTED") patch.acceptedAt = params.now;
    if (params.status === "IN_PROGRESS") patch.startedAt = params.now;
    if (params.status === "COMPLETED") patch.completedAt = params.now;
    if (params.status === "DELAYED") patch.delayedAt = params.now;

    return this.prisma.workOrder.update({
      where: { id: params.id },
      data: patch,
      include: {
        providerService: { include: { provider: true } },
        zone: true,
        evidences: true,
      },
    });
  }

  addEvidence(params: { workOrderId: string; type: string; url?: string; note?: string }) {
    return this.prisma.workOrderEvidence.create({
      data: {
        workOrderId: params.workOrderId,
        type: params.type,
        url: params.url ?? null,
        note: params.note ?? null,
      },
    });
  }
}
