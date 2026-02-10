import { Body, Controller, Get, Param, Patch, Post, Put, Req } from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { EventsService } from "../application/events.service";
import { CreateEventDto } from "./dto/create-event.dto";
import { CreateZoneDto } from "./dto/create-zone.dto";
import { UpdateEventResourcesDto } from "./dto/update-event-resources.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

@Controller()
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/events")
  createEvent(@Param("orgId") orgId: string, @Body() dto: CreateEventDto, @Req() req: any) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.createEvent({
      organizationId: orgId,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      venue: dto.venue,
      venueId: dto.venueId,
      imageUrl: dto.imageUrl,
      imageKey: dto.imageKey,
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }

  @Get("/orgs/:orgId/events")
  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  listEvents(@Param("orgId") orgId: string) {
    return this.service.listEvents(orgId);
  }

  @Get("/orgs/:orgId/events/:eventId")
  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  getEvent(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.getEvent(orgId, eventId);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Patch("/orgs/:orgId/events/:eventId")
  updateEvent(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.updateEvent({
      organizationId: orgId,
      eventId,
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate,
      endDate: dto.endDate,
      venue: dto.venue,
      venueId: dto.venueId,
      imageUrl: dto.imageUrl,
      imageKey: dto.imageKey,
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Put("/orgs/:orgId/events/:eventId/resources")
  updateResources(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Body() dto: UpdateEventResourcesDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.updateEventResources({
      organizationId: orgId,
      eventId,
      staffIds: dto.staffIds ?? [],
      assetIds: dto.assetIds ?? [],
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/resources")
  getResources(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.getEventResources({ organizationId: orgId, eventId });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/events/:eventId/zones")
  createZone(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Body() dto: CreateZoneDto,
  ) {
    return this.service.createZone({
      organizationId: orgId,
      eventId,
      name: dto.name,
      type: dto.type,
    });
  }

  @Get("/orgs/:orgId/events/:eventId/zones")
  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  listZones(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listZones({ organizationId: orgId, eventId });
  }
}
