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
import { IncidentsService } from "../application/incidents.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import { UpdateIncidentStatusDto } from "./dto/update-incident-status.dto";
import { IncidentStatus, OrgRole } from "@prisma/client";
import { Roles } from "../../auth/security/roles.decorator";
import { AddIncidentEvidenceDto } from "./dto/add-incident-evidence.dto";
import { CreateIncidentTaskDto } from "./dto/create-incident-task.dto";

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller("orgs/:orgId/events/:eventId/incidents")
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post()
  createIncident(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Body() dto: CreateIncidentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgentHeader = req.headers["user-agent"];
    const userAgent =
      typeof userAgentHeader === "string" ? userAgentHeader : null;

    return this.service.createIncident({
      organizationId: orgId,
      eventId,
      zoneId: dto.zoneId,
      title: dto.title,
      description: dto.description,
      severity: dto.severity,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      reportedByUserId: userId,
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
  listIncidents(
    @Param("eventId") eventId: string,
    @Query("status") status?: IncidentStatus,
  ) {
    return this.service.listByEvent({
      eventId,
      status,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Patch(":incidentId/status")
  updateStatus(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("incidentId") incidentId: string,
    @Body() dto: UpdateIncidentStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgentHeader = req.headers["user-agent"];
    const userAgent =
      typeof userAgentHeader === "string" ? userAgentHeader : null;

    return this.service.updateStatus({
      organizationId: orgId,
      eventId,
      incidentId,
      nextStatus: dto.status,
      performedByUserId: userId,
      ip,
      userAgent,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Patch(":incidentId")
  updateIncident(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("incidentId") incidentId: string,
    @Body() dto: UpdateIncidentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgentHeader = req.headers["user-agent"];
    const userAgent =
      typeof userAgentHeader === "string" ? userAgentHeader : null;

    return this.service.updateIncident({
      organizationId: orgId,
      eventId,
      incidentId,
      data: dto,
      performedByUserId: userId,
      ip,
      userAgent,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post(":incidentId/evidence")
  addEvidence(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("incidentId") incidentId: string,
    @Body() dto: AddIncidentEvidenceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgentHeader = req.headers["user-agent"];
    const userAgent =
      typeof userAgentHeader === "string" ? userAgentHeader : null;

    return this.service.addEvidence({
      organizationId: orgId,
      eventId,
      incidentId,
      type: dto.type,
      url: dto.url,
      note: dto.note,
      performedByUserId: userId,
      ip,
      userAgent,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post(":incidentId/tasks")
  createTask(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("incidentId") incidentId: string,
    @Body() dto: CreateIncidentTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgentHeader = req.headers["user-agent"];
    const userAgent =
      typeof userAgentHeader === "string" ? userAgentHeader : null;

    return this.service.createTaskFromIncident({
      organizationId: orgId,
      eventId,
      incidentId,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueDate: dto.dueDate,
      assigneeId: dto.assigneeId,
      assigneeStaffMemberId: dto.assigneeStaffMemberId,
      relatedLabel: dto.relatedLabel,
      performedByUserId: userId,
      ip,
      userAgent,
    });
  }
}
