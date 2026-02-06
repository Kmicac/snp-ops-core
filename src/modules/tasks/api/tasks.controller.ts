import { Body, Controller, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { OrgRole, TaskStatus } from "@prisma/client";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { TasksService } from "../application/tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { CreateTaskCommentDto } from "./dto/create-task-comment.dto";

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
      dueAt: dto.dueAt,
      eventId: dto.eventId,
      zoneId: dto.zoneId,
      workOrderId: dto.workOrderId,
      incidentId: dto.incidentId,
      improvementId: dto.improvementId,
      sponsorshipId: dto.sponsorshipId,
      assignedToId: dto.assignedToId,
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
  listTasks(
    @Param("orgId") orgId: string,
    @Query("eventId") eventId?: string,
    @Query("status") status?: TaskStatus,
    @Query("assignedToId") assignedToId?: string,
  ) {
    return this.service.listTasksByOrg({
      organizationId: orgId,
      eventId,
      status,
      assignedToId,
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
  getTask(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
  ) {
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
        dueAt: dto.dueAt,
        eventId: dto.eventId,
        zoneId: dto.zoneId,
        workOrderId: dto.workOrderId,
        incidentId: dto.incidentId,
        improvementId: dto.improvementId,
        sponsorshipId: dto.sponsorshipId,
        assignedToId: dto.assignedToId,
      },
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
  @Post(":taskId/comments")
  addComment(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
    @Body() dto: CreateTaskCommentDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub ?? null;

    return this.service.addComment({
      organizationId: orgId,
      taskId,
      authorId: userId,
      body: dto.body,
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
  listComments(
    @Param("orgId") orgId: string,
    @Param("taskId") taskId: string,
  ) {
    return this.service.listComments({ organizationId: orgId, taskId });
  }
}
