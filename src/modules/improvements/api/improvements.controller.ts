import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import {
  ImprovementStatus,
  ImprovementType,
  OrgRole,
} from "@prisma/client";
import { ImprovementsService } from "../application/improvements.service";
import { CreateImprovementDto } from "./dto/create-improvement.dto";
import { UpdateImprovementStatusDto } from "./dto/update-improvement-status.dto";
import { Roles } from "../../auth/security/roles.decorator";

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller("orgs/:orgId/improvements")
export class ImprovementsController {
  constructor(private readonly service: ImprovementsService) {}

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post()
  createImprovement(
    @Param("orgId") orgId: string,
    @Body() dto: CreateImprovementDto,
    @Req() req: AuthenticatedRequest
  ) {
    const user = req.user as any;
    const userId = user?.sub ?? null;
    const ip = req.ip ?? null;
    const uaHeader = req.headers["user-agent"];
    const userAgent = typeof uaHeader === "string" ? uaHeader : null;

    return this.service.createImprovement({
      organizationId: orgId,
      eventId: dto.eventId,
      incidentId: dto.incidentId,
      createdById: userId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      priority: dto.priority,
      ip,
      userAgent,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get()
  listImprovements(
    @Param("orgId") orgId: string,
    @Query("eventId") eventId?: string,
    @Query("status") status?: ImprovementStatus,
    @Query("type") type?: ImprovementType,
  ) {
    return this.service.listImprovements({
      organizationId: orgId,
      eventId,
      status,
      type,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Patch(":improvementId/status")
  updateStatus(
    @Param("orgId") orgId: string,
    @Param("improvementId") improvementId: string,
    @Body() dto: UpdateImprovementStatusDto,
    @Req() req: AuthenticatedRequest
  ) {
    const user = req.user as any;
    const userId = user?.sub ?? null;
    const ip = req.ip ?? null;
    const uaHeader = req.headers["user-agent"];
    const userAgent = typeof uaHeader === "string" ? uaHeader : null;

    return this.service.updateStatus({
      organizationId: orgId,
      improvementId,
      nextStatus: dto.status,
      performedByUserId: userId,
      ip,
      userAgent,
    });
  }
}
