import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { OrgRole, WorkOrderStatus } from "@prisma/client";
import { WorkOrdersService } from "../application/work-orders.service";
import { AddEvidenceDto } from "./dto/add-evidence.dto";
import { CreateWorkOrderDto } from "./dto/create-work-order.dto";
import { UpdateWorkOrderStatusDto } from "./dto/update-work-order-status.dto";
import { Roles } from "src/modules/auth/security/roles.decorator";

@Controller()
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) { }

  // Depende de un ProviderService (servicio contratado) dentro del evento
  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Post("/orgs/:orgId/events/:eventId/provider-services/:providerServiceId/work-orders")
  create(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("providerServiceId") providerServiceId: string,
    @Body() dto: CreateWorkOrderDto,
  ) {
    return this.service.create({
      organizationId: orgId,
      eventId,
      providerServiceId,
      title: dto.title,
      description: dto.description,
      zoneId: dto.zoneId,
      scheduledStartAt: dto.scheduledStartAt,
      scheduledEndAt: dto.scheduledEndAt,
    });
  }

  @Get("/orgs/:orgId/events/:eventId/work-orders")
  list(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Query("status") status?: WorkOrderStatus,
    @Query("zoneId") zoneId?: string,
  ) {
    return this.service.listByEvent({ organizationId: orgId, eventId, status, zoneId });
  }

  @Get("/orgs/:orgId/events/:eventId/work-orders/:workOrderId")
  get(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("workOrderId") workOrderId: string,
  ) {
    return this.service.get({ organizationId: orgId, eventId, workOrderId });
  }

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Patch("/orgs/:orgId/events/:eventId/work-orders/:workOrderId/status")
  updateStatus(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("workOrderId") workOrderId: string,
    @Body() dto: UpdateWorkOrderStatusDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.updateStatus({
      organizationId: orgId,
      eventId,
      workOrderId,
      nextStatus: dto.status,
      note: dto.note,
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }

  @Post("/orgs/:orgId/events/:eventId/work-orders/:workOrderId/evidence")
  addEvidence(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("workOrderId") workOrderId: string,
    @Body() dto: AddEvidenceDto,
  ) {
    return this.service.addEvidence({
      organizationId: orgId,
      eventId,
      workOrderId,
      type: dto.type,
      url: dto.url,
      note: dto.note,
    });
  }
}
