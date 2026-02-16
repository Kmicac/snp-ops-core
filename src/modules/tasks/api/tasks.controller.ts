import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { OrgRole } from "@prisma/client";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { TasksService } from "../application/tasks.service";
import { CreateTaskChecklistItemDto } from "./dto/create-task-checklist-item.dto";
import { CreateTaskCommentDto } from "./dto/create-task-comment.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { ListTasksQueryDto } from "./dto/list-tasks-query.dto";
import { MoveTaskDto } from "./dto/move-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

@Controller("orgs/:orgId/tasks")
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Post()
  createTask(
    @Param("orgId") orgId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.createTask({
      organizationId: orgId,
      createdById: userId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: dto.status,
      priority: dto.priority,
      labels: dto.labels,
      imageUrl: dto.imageUrl,
      imageKey: dto.imageKey,
      position: dto.position,
      dueDate: dto.dueDate,
      dueAt: dto.dueAt,
      eventId: dto.eventId,
      zoneId: dto.zoneId,
      relatedWorkOrderId: dto.relatedWorkOrderId,
      relatedIncidentId: dto.relatedIncidentId,
      improvementId: dto.improvementId,
      relatedSponsorshipId: dto.relatedSponsorshipId,
      relatedLabel: dto.relatedLabel,
      assigneeId: dto.assigneeId,
      assignedToId: dto.assignedToId,
      workOrderId: dto.workOrderId,
      incidentId: dto.incidentId,
      sponsorshipId: dto.sponsorshipId,
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
  @Get()
  listTasks(@Param("orgId") orgId: string, @Query() query: ListTasksQueryDto) {
    return this.service.listTasksByOrg({
      organizationId: orgId,
      eventId: query.eventId,
      status: query.status,
      priority: query.priority,
      type: query.types ?? (query.type ? [query.type] : undefined),
      labels: query.labels,
      assigneeId: query.assigneeId ?? query.assignedToId,
      search: query.q ?? query.search,
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
  @Get(":taskId")
  getTask(@Param("orgId") orgId: string, @Param("taskId") taskId: string) {
    return this.service.getTask({ organizationId: orgId, taskId });
  }

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Patch(":taskId")
  updateTask(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateTaskDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.updateTask({
      organizationId: orgId,
      taskId,
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: dto.status,
        priority: dto.priority,
        labels: dto.labels,
        imageUrl: dto.imageUrl,
        imageKey: dto.imageKey,
        position: dto.position,
        dueDate: dto.dueDate,
        dueAt: dto.dueAt,
        eventId: dto.eventId,
        zoneId: dto.zoneId,
        relatedWorkOrderId: dto.relatedWorkOrderId,
        relatedIncidentId: dto.relatedIncidentId,
        improvementId: dto.improvementId,
        relatedSponsorshipId: dto.relatedSponsorshipId,
        relatedLabel: dto.relatedLabel,
        assigneeId: dto.assigneeId,
        assignedToId: dto.assignedToId,
        workOrderId: dto.workOrderId,
        incidentId: dto.incidentId,
        sponsorshipId: dto.sponsorshipId,
      },
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Post(":taskId/move")
  @HttpCode(200)
  moveTaskPost(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @Body() dto: MoveTaskDto,
    @Req() req: any,
  ) {
    return this.moveTaskInternal(orgId, taskId, dto, req);
  }

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Patch(":taskId/move")
  moveTaskPatch(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @Body() dto: MoveTaskDto,
    @Req() req: any,
  ) {
    return this.moveTaskInternal(orgId, taskId, dto, req);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get(":taskId/activity")
  listActivity(@Param("orgId") orgId: string, @Param("taskId") taskId: string) {
    return this.service.listActivity({ organizationId: orgId, taskId });
  }

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Post(":taskId/comments")
  addComment(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @Body() dto: CreateTaskCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.addComment({
      organizationId: orgId,
      taskId,
      authorId: userId,
      message: dto.message,
      body: dto.body,
      imageUrl: dto.imageUrl,
      imageKey: dto.imageKey,
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
  @Get(":taskId/comments")
  listComments(@Param("orgId") orgId: string, @Param("taskId") taskId: string) {
    return this.service.listComments({ organizationId: orgId, taskId });
  }

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Post(":taskId/checklist")
  addChecklistItem(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @Body() dto: CreateTaskChecklistItemDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.addChecklistItem({
      organizationId: orgId,
      taskId,
      text: dto.text,
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }

  @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
  @Patch(":taskId/checklist/:itemId")
  toggleChecklistItem(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @Param("itemId") itemId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.toggleChecklistItem({
      organizationId: orgId,
      taskId,
      itemId,
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }

  private moveTaskInternal(orgId: string, taskId: string, dto: MoveTaskDto, req: any) {
    const userId = req.user?.sub ?? null;
    const ip = req.ip ?? null;
    const userAgent = req.headers["user-agent"] ?? null;

    return this.service.moveTask({
      organizationId: orgId,
      taskId,
      newStatus: dto.status ?? dto.newStatus,
      position: dto.position,
      beforeTaskId: dto.beforeTaskId,
      afterTaskId: dto.afterTaskId,
      overTaskId: dto.overTaskId,
      performedByUserId: userId,
      ip,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    });
  }
}
