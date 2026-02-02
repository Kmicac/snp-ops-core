import { Controller, Get, Param, Query } from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { AuditService } from "../application/audit.service";

@Controller()
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/audit-logs")
  listByEvent(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Query("limit") limit?: string,
  ) {
    const l = limit ? Number(limit) : 100;
    return this.service.listByEvent(orgId, eventId, l);
  }
}
