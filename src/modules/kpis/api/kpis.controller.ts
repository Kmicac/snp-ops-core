import { Controller, Get, Param, Query } from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { KpisService } from "../application/kpis.service";

@Controller()
export class KpisController {
  constructor(private readonly service: KpisService) {}

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/kpis/summary")
  summary(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.summary({ organizationId: orgId, eventId });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/kpis/overdue")
  overdue(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.overdue({
      organizationId: orgId,
      eventId,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/kpis/sla-breaches")
  slaBreaches(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.slaBreaches({
      organizationId: orgId,
      eventId,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
