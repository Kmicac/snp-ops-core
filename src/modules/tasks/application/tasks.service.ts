import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AuditActionType,
  AuditEntityType,
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import { TasksRepository } from "../infrastructure/tasks.repo";
import { AuditService } from "src/modules/audit/application/audit.service";

@Injectable()
export class TasksService {
  constructor(
    private readonly repo: TasksRepository,
    private readonly audit: AuditService,
  ) {}

  private async assertRelations(params: {
    organizationId: string;
    eventId?: string | null;
    zoneId?: string | null;
    workOrderId?: string | null;
    incidentId?: string | null;
    improvementId?: string | null;
    sponsorshipId?: string | null;
  }) {
    const {
      organizationId,
      eventId,
      zoneId,
      workOrderId,
      incidentId,
      improvementId,
      sponsorshipId,
    } = params;

    if (eventId) await this.repo.assertEventInOrg(eventId, organizationId);
    if (zoneId) await this.repo.assertZoneInOrg(zoneId, organizationId);
    if (workOrderId) await this.repo.assertWorkOrderInOrg(workOrderId, organizationId);
    if (incidentId) await this.repo.assertIncidentInOrg(incidentId, organizationId);
    if (improvementId) await this.repo.assertImprovementInOrg(improvementId, organizationId);
    if (sponsorshipId) await this.repo.assertSponsorshipInOrg(sponsorshipId, organizationId);
  }

  async createTask(params: {
    organizationId: string;
    createdById?: string | null;
    title: string;
    description?: string;
    type?: TaskType;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueAt?: string;
    eventId?: string;
    zoneId?: string;
    workOrderId?: string;
    incidentId?: string;
    improvementId?: string;
    sponsorshipId?: string;
    assignedToId?: string;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (!params.createdById) {
      throw new BadRequestException("createdById is required");
    }

    await this.assertRelations({
      organizationId: params.organizationId,
      eventId: params.eventId,
      zoneId: params.zoneId,
      workOrderId: params.workOrderId,
      incidentId: params.incidentId,
      improvementId: params.improvementId,
      sponsorshipId: params.sponsorshipId,
    });

    const status = params.status ?? TaskStatus.TODO;
    const now = new Date();

    const created = await this.repo.createTask({
      organizationId: params.organizationId,
      eventId: params.eventId ?? null,
      zoneId: params.zoneId ?? null,
      workOrderId: params.workOrderId ?? null,
      incidentId: params.incidentId ?? null,
      improvementId: params.improvementId ?? null,
      sponsorshipId: params.sponsorshipId ?? null,
      title: params.title.trim(),
      description: params.description?.trim() ?? null,
      type: params.type ?? TaskType.GENERAL,
      status,
      priority: params.priority ?? TaskPriority.MEDIUM,
      dueAt: params.dueAt ? new Date(params.dueAt) : null,
      completedAt: status === TaskStatus.DONE ? now : null,
      createdById: params.createdById,
      assignedToId: params.assignedToId ?? null,
      createdAt: now,
      updatedAt: now,
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: created.eventId ?? null,
      userId: params.createdById,
      entityType: AuditEntityType.TASK,
      entityId: created.id,
      action: AuditActionType.CREATED,
      message: `Task created: ${created.title}`,
      changes: {
        status: created.status,
        priority: created.priority,
        assignedToId: created.assignedToId,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return created;
  }

  listTasksByOrg(params: {
    organizationId: string;
    eventId?: string;
    status?: TaskStatus;
    assignedToId?: string;
  }) {
    return this.repo.listTasksByOrg(params);
  }

  getTask(params: { organizationId: string; taskId: string }) {
    return this.repo.getTaskOrThrow(params.taskId, params.organizationId);
  }

  async updateTask(params: {
    organizationId: string;
    taskId: string;
    data: {
      title?: string;
      description?: string | null;
      type?: TaskType;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueAt?: string | null;
      eventId?: string | null;
      zoneId?: string | null;
      workOrderId?: string | null;
      incidentId?: string | null;
      improvementId?: string | null;
      sponsorshipId?: string | null;
      assignedToId?: string | null;
    };
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const current = await this.repo.getTaskOrThrow(
      params.taskId,
      params.organizationId,
    );

    const data = params.data;

    await this.assertRelations({
      organizationId: params.organizationId,
      eventId: data.eventId,
      zoneId: data.zoneId,
      workOrderId: data.workOrderId,
      incidentId: data.incidentId,
      improvementId: data.improvementId,
      sponsorshipId: data.sponsorshipId,
    });

    const patch: Prisma.TaskUncheckedUpdateInput = {};

    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.description !== undefined) {
      patch.description = data.description?.trim() ?? null;
    }
    if (data.type !== undefined) patch.type = data.type;
    if (data.status !== undefined) patch.status = data.status;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.dueAt !== undefined) {
      patch.dueAt = data.dueAt ? new Date(data.dueAt) : null;
    }

    if (data.eventId !== undefined) patch.eventId = data.eventId ?? null;
    if (data.zoneId !== undefined) patch.zoneId = data.zoneId ?? null;
    if (data.workOrderId !== undefined) patch.workOrderId = data.workOrderId ?? null;
    if (data.incidentId !== undefined) patch.incidentId = data.incidentId ?? null;
    if (data.improvementId !== undefined) patch.improvementId = data.improvementId ?? null;
    if (data.sponsorshipId !== undefined) patch.sponsorshipId = data.sponsorshipId ?? null;
    if (data.assignedToId !== undefined) patch.assignedToId = data.assignedToId ?? null;

    if (data.status === TaskStatus.DONE && !current.completedAt) {
      patch.completedAt = new Date();
    }

    const updated = await this.repo.updateTask({
      taskId: params.taskId,
      data: patch,
    });

    if (data.status !== undefined && data.status !== current.status) {
      await this.audit.log({
        organizationId: params.organizationId,
        eventId: updated.eventId ?? null,
        userId: params.performedByUserId ?? null,
        entityType: AuditEntityType.TASK,
        entityId: updated.id,
        action: AuditActionType.STATUS_CHANGED,
        message: `Task status changed from ${current.status} to ${updated.status}`,
        changes: {
          fromStatus: current.status,
          toStatus: updated.status,
        },
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      });
    }

    return updated;
  }

  async addComment(params: {
    organizationId: string;
    taskId: string;
    authorId?: string | null;
    body: string;
  }) {
    if (!params.authorId) {
      throw new BadRequestException("authorId is required");
    }

    await this.repo.getTaskOrThrow(params.taskId, params.organizationId);

    return this.repo.addComment({
      taskId: params.taskId,
      authorId: params.authorId,
      body: params.body.trim(),
    });
  }

  async listComments(params: { organizationId: string; taskId: string }) {
    await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    return this.repo.listComments(params.taskId);
  }
}
