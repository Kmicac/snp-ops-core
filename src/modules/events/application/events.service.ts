import { Injectable } from "@nestjs/common";
import { AuditActionType, AuditEntityType, Prisma } from "@prisma/client";
import { AuditService } from "src/modules/audit/application/audit.service";
import {
  EventResourcesResponseDto,
  EventResponseDto,
  EventStatusDto,
} from "../api/dto/event-response.dto";
import { EventWithMetrics, EventsRepo } from "../infrastructure/events.repo";

@Injectable()
export class EventsService {
  constructor(
    private readonly repo: EventsRepo,
    private readonly audit: AuditService,
  ) {}

  private resolveStatus(event: {
    startDate: Date | null;
    endDate: Date | null;
  }): EventStatusDto {
    const now = new Date();

    if (event.endDate && now > event.endDate) {
      return "COMPLETED";
    }
    if (event.startDate && now >= event.startDate) {
      return "IN_PROGRESS";
    }
    return "PLANNED";
  }

  private mapEvent(event: EventWithMetrics): EventResponseDto {
    const staffAssignedCount = new Set(
      event.resources
        .map((resource) => resource.staffMemberId)
        .filter((id): id is string => Boolean(id)),
    ).size;

    const assetsAssignedCount = new Set(
      event.resources
        .map((resource) => resource.assetId)
        .filter((id): id is string => Boolean(id)),
    ).size;

    return {
      id: event.id,
      orgId: event.organizationId,
      organizationId: event.organizationId,
      code: event.code,
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue ?? event.venueRef?.name ?? null,
      venueId: event.venueId,
      status: this.resolveStatus(event),
      imageUrl: event.imageUrl ?? null,
      imageKey: event.imageKey ?? null,
      workOrdersCount: event._count.workOrders,
      incidentsCount: event._count.incidents,
      sponsorsCount: event._count.sponsorships,
      staffAssignedCount,
      assetsAssignedCount,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  async createEvent(params: {
    organizationId: string;
    code: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    venue?: string;
    venueId?: string;
    imageUrl?: string;
    imageKey?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<EventResponseDto> {
    const created = await this.repo.createEvent({
      organizationId: params.organizationId,
      code: params.code.trim(),
      name: params.name.trim(),
      description: params.description?.trim(),
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      venue: params.venue?.trim(),
      venueId: params.venueId,
      imageUrl: params.imageUrl?.trim(),
      imageKey: params.imageKey?.trim(),
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: created.id,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.EVENT,
      entityId: created.id,
      action: AuditActionType.CREATED,
      message: `Event created: ${created.code}`,
      changes: {
        code: created.code,
        name: created.name,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.mapEvent(created);
  }

  async listEvents(organizationId: string): Promise<EventResponseDto[]> {
    const events = await this.repo.listEvents(organizationId);
    return events.map((event) => this.mapEvent(event));
  }

  async getEvent(organizationId: string, eventId: string): Promise<EventResponseDto> {
    const event = await this.repo.getEventOrThrow(eventId, organizationId);
    return this.mapEvent(event);
  }

  async updateEvent(params: {
    organizationId: string;
    eventId: string;
    name?: string;
    description?: string | null;
    startDate?: string;
    endDate?: string;
    venue?: string | null;
    venueId?: string | null;
    imageUrl?: string | null;
    imageKey?: string | null;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<EventResponseDto> {
    const current = await this.repo.getEventOrThrow(params.eventId, params.organizationId);

    const data: Prisma.EventUncheckedUpdateInput = {};
    if (params.name !== undefined) data.name = params.name.trim();
    if (params.description !== undefined) {
      data.description = params.description?.trim() ?? null;
    }
    if (params.startDate !== undefined) {
      data.startDate = params.startDate ? new Date(params.startDate) : null;
    }
    if (params.endDate !== undefined) {
      data.endDate = params.endDate ? new Date(params.endDate) : null;
    }
    if (params.venue !== undefined) {
      data.venue = params.venue?.trim() ?? null;
    }
    if (params.venueId !== undefined) {
      data.venueId = params.venueId ?? null;
    }
    if (params.imageUrl !== undefined) {
      data.imageUrl = params.imageUrl?.trim() ?? null;
    }
    if (params.imageKey !== undefined) {
      data.imageKey = params.imageKey?.trim() ?? null;
    }

    const updated = await this.repo.updateEvent({
      eventId: params.eventId,
      data,
    });

    const changedImage =
      params.imageUrl !== undefined || params.imageKey !== undefined;

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: updated.id,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.EVENT,
      entityId: updated.id,
      action: AuditActionType.UPDATED,
      message: changedImage ? "Event updated (including image)" : "Event updated",
      changes: {
        before: {
          name: current.name,
          description: current.description,
          startDate: current.startDate,
          endDate: current.endDate,
          venue: current.venue,
          imageUrl: current.imageUrl,
          imageKey: current.imageKey,
        },
        after: {
          name: updated.name,
          description: updated.description,
          startDate: updated.startDate,
          endDate: updated.endDate,
          venue: updated.venue,
          imageUrl: updated.imageUrl,
          imageKey: updated.imageKey,
        },
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.mapEvent(updated);
  }

  createZone(params: {
    organizationId: string;
    eventId: string;
    name: string;
    type?: string;
  }) {
    return this.repo
      .getEventOrThrow(params.eventId, params.organizationId)
      .then(() =>
        this.repo.createZone({
          eventId: params.eventId,
          name: params.name.trim(),
          type: params.type?.trim(),
        }),
      );
  }

  listZones(params: { organizationId: string; eventId: string }) {
    return this.repo
      .getEventOrThrow(params.eventId, params.organizationId)
      .then(() => this.repo.listZones(params.eventId));
  }

  async updateEventResources(params: {
    organizationId: string;
    eventId: string;
    staffIds?: string[];
    assetIds?: string[];
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<EventResourcesResponseDto> {
    await this.repo.getEventOrThrow(params.eventId, params.organizationId);

    const resources = await this.repo.replaceEventResources({
      organizationId: params.organizationId,
      eventId: params.eventId,
      staffIds: params.staffIds ?? [],
      assetIds: params.assetIds ?? [],
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.EVENT,
      entityId: params.eventId,
      action: AuditActionType.UPDATED,
      message: "Event resources updated",
      changes: {
        kind: "resources_updated",
        staffAssignedCount: resources.staffIds.length,
        assetsAssignedCount: resources.assetIds.length,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return resources;
  }

  async getEventResources(params: {
    organizationId: string;
    eventId: string;
  }): Promise<EventResourcesResponseDto> {
    await this.repo.getEventOrThrow(params.eventId, params.organizationId);
    return this.repo.getEventResources(params);
  }
}
