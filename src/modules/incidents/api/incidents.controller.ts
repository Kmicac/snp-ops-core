import { Body, Controller, Post, Param } from "@nestjs/common";
import { IncidentsService } from "../application/incidents.service";
import { IncidentSeverity, IncidentType } from "../domain/incident.types";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller("/orgs/:orgId/events/:eventId/incidents")
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Post()
  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HR,
    OrgRole.TECH_SYSTEMS
  )
  create(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Body()
    body: {
      type: IncidentType;
      severity: IncidentSeverity;
      title: string;
      description: string;
    }
  ) {
    return this.service.createIncident({
      organizationId: orgId,
      eventId,
      ...body,
      createdById: "TODO_FROM_AUTH_CONTEXT",
    });
  }
}
