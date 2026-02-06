import { Injectable } from '@nestjs/common';
import { EventsRepo } from '../infrastructure/events.repo';

@Injectable()
export class EventsService {
  constructor(private readonly repo: EventsRepo) {}

  createEvent(params: {
    organizationId: string;
    code: string;
    name: string;
    startDate?: string;
    endDate?: string;
    venueId?: string;
  }) {
    return this.repo.createEvent({
      organizationId: params.organizationId,
      code: params.code.trim(),
      name: params.name.trim(),
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      venueId: params.venueId,
    });
  }

  listEvents(organizationId: string) {
    return this.repo.listEvents(organizationId);
  }

  getEvent(organizationId: string, eventId: string) {
    return this.repo.getEventOrThrow(eventId, organizationId);
  }

  async updateEvent(params: {
    organizationId: string;
    eventId: string;
    code?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    venueId?: string | null;
  }) {
    await this.repo.getEventOrThrow(params.eventId, params.organizationId);

    return this.repo.updateEvent({
      eventId: params.eventId,
      data: {
        ...(params.code !== undefined ? { code: params.code.trim() } : {}),
        ...(params.name !== undefined ? { name: params.name.trim() } : {}),
        ...(params.startDate !== undefined
          ? { startDate: params.startDate ? new Date(params.startDate) : null }
          : {}),
        ...(params.endDate !== undefined
          ? { endDate: params.endDate ? new Date(params.endDate) : null }
          : {}),
        ...(params.venueId !== undefined ? { venueId: params.venueId ?? null } : {}),
      },
    });
  }

  createZone(params: {
    organizationId: string;
    eventId: string;
    name: string;
    type?: string;
  }) {
    // Scoping pro: primero valida que el event pertenece a la organización
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
}
