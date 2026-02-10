import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AuditActionType,
  AuditEntityType,
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import { AuditService } from "src/modules/audit/application/audit.service";
import {
  TaskCommentResponseDto,
  TaskResponseDto,
} from "../api/dto/task-response.dto";
import { TaskWithRelations, TasksRepository } from "../infrastructure/tasks.repo";

@Injectable()
export class TasksService {
  constructor(
    private readonly repo: TasksRepository,
    private readonly audit: AuditService,
  ) {}

  private mapComment(comment: {
    id: string;
    authorId: string;
    body: string;
    createdAt: Date;
    author: { fullName: string | null; email: string } | null;
  }): TaskCommentResponseDto {
    return {
      id: comment.id,
      authorId: comment.authorId,
      authorName: comment.author?.fullName ?? comment.author?.email ?? "Unknown",
      authorAvatarUrl: null,
      message: comment.body,
      createdAt: comment.createdAt,
    };
  }

  private mapTask(task: TaskWithRelations): TaskResponseDto {
    const comments = task.comments.map((comment) => this.mapComment(comment));
    const checklistDone = task.checklist.filter((item) => item.done).length;

    return {
      id: task.id,
      orgId: task.organizationId,
      organizationId: task.organizationId,
      eventId: task.eventId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      type: task.type,
      assigneeId: task.assignedToId,
      assigneeName: task.assignedTo?.fullName ?? task.assignedTo?.email ?? null,
      assigneeAvatarUrl: null,
      dueDate: task.dueAt,
      relatedWorkOrderId: task.workOrderId,
      relatedIncidentId: task.incidentId,
      relatedSponsorshipId: task.sponsorshipId,
      relatedLabel: task.relatedLabel,
      checklist: task.checklist.map((item) => ({
        id: item.id,
        text: item.text,
        done: item.done,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      checklistDone,
      checklistTotal: task.checklist.length,
      comments,
      commentsCount: comments.length,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private getDateInput(params: {
    dueDate?: string | null;
    dueAt?: string | null;
  }): string | null | undefined {
    if (params.dueDate !== undefined) return params.dueDate;
    if (params.dueAt !== undefined) return params.dueAt;
    return undefined;
  }

  private async assertRelations(params: {
    organizationId: string;
    eventId?: string | null;
    zoneId?: string | null;
    relatedWorkOrderId?: string | null;
    relatedIncidentId?: string | null;
    improvementId?: string | null;
    relatedSponsorshipId?: string | null;
    assigneeId?: string | null;
  }) {
    const {
      organizationId,
      eventId,
      zoneId,
      relatedWorkOrderId,
      relatedIncidentId,
      improvementId,
      relatedSponsorshipId,
      assigneeId,
    } = params;

    if (eventId) await this.repo.assertEventInOrg(eventId, organizationId);
    if (zoneId) await this.repo.assertZoneInOrg(zoneId, organizationId);
    if (improvementId) await this.repo.assertImprovementInOrg(improvementId, organizationId);
    if (assigneeId) await this.repo.assertAssigneeInOrg(assigneeId, organizationId);

    if (relatedWorkOrderId) {
      const workOrder = await this.repo.getWorkOrderScopeInOrg(
        relatedWorkOrderId,
        organizationId,
      );
      if (eventId && workOrder.eventId !== eventId) {
        throw new BadRequestException(
          "relatedWorkOrderId must belong to the same eventId",
        );
      }
    }

    if (relatedIncidentId) {
      const incident = await this.repo.getIncidentScopeInOrg(
        relatedIncidentId,
        organizationId,
      );
      if (eventId && incident.eventId !== eventId) {
        throw new BadRequestException(
          "relatedIncidentId must belong to the same eventId",
        );
      }
    }

    if (relatedSponsorshipId) {
      const sponsorship = await this.repo.getSponsorshipScopeInOrg(
        relatedSponsorshipId,
        organizationId,
      );
      if (eventId && sponsorship.eventId !== eventId) {
        throw new BadRequestException(
          "relatedSponsorshipId must belong to the same eventId",
        );
      }
    }
  }

  async createTask(params: {
    organizationId: string;
    createdById?: string | null;
    title: string;
    description?: string;
    type?: TaskType;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    dueAt?: string;
    eventId?: string;
    zoneId?: string;
    relatedWorkOrderId?: string;
    relatedIncidentId?: string;
    improvementId?: string;
    relatedSponsorshipId?: string;
    relatedLabel?: string;
    assigneeId?: string;
    assignedToId?: string;
    workOrderId?: string;
    incidentId?: string;
    sponsorshipId?: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    if (!params.createdById) {
      throw new BadRequestException("createdById is required");
    }

    const eventId = params.eventId ?? undefined;
    const assigneeId = params.assigneeId ?? params.assignedToId ?? undefined;
    const relatedWorkOrderId = params.relatedWorkOrderId ?? params.workOrderId ?? undefined;
    const relatedIncidentId = params.relatedIncidentId ?? params.incidentId ?? undefined;
    const relatedSponsorshipId =
      params.relatedSponsorshipId ?? params.sponsorshipId ?? undefined;
    const dueDateInput = this.getDateInput({
      dueDate: params.dueDate,
      dueAt: params.dueAt,
    });

    await this.assertRelations({
      organizationId: params.organizationId,
      eventId,
      zoneId: params.zoneId,
      relatedWorkOrderId,
      relatedIncidentId,
      improvementId: params.improvementId,
      relatedSponsorshipId,
      assigneeId,
    });

    const status = params.status ?? TaskStatus.TODO;
    const now = new Date();

    const created = await this.repo.createTask({
      organizationId: params.organizationId,
      eventId: eventId ?? null,
      zoneId: params.zoneId ?? null,
      workOrderId: relatedWorkOrderId ?? null,
      incidentId: relatedIncidentId ?? null,
      improvementId: params.improvementId ?? null,
      sponsorshipId: relatedSponsorshipId ?? null,
      relatedLabel: params.relatedLabel?.trim() ?? null,
      title: params.title.trim(),
      description: params.description?.trim() ?? null,
      type: params.type ?? TaskType.GENERAL,
      status,
      priority: params.priority ?? TaskPriority.MEDIUM,
      dueAt: dueDateInput ? new Date(dueDateInput) : null,
      completedAt: status === TaskStatus.DONE ? now : null,
      createdById: params.createdById,
      assignedToId: assigneeId ?? null,
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
        assigneeId: created.assignedToId,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.mapTask(created);
  }

  async listTasksByOrg(params: {
    organizationId: string;
    eventId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    assigneeId?: string;
    search?: string;
  }): Promise<TaskResponseDto[]> {
    const tasks = await this.repo.listTasksByOrg(params);
    return tasks.map((task) => this.mapTask(task));
  }

  async getTask(params: {
    organizationId: string;
    taskId: string;
  }): Promise<TaskResponseDto> {
    const task = await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    return this.mapTask(task);
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
      dueDate?: string | null;
      dueAt?: string | null;
      eventId?: string | null;
      zoneId?: string | null;
      relatedWorkOrderId?: string | null;
      relatedIncidentId?: string | null;
      improvementId?: string | null;
      relatedSponsorshipId?: string | null;
      relatedLabel?: string | null;
      assigneeId?: string | null;
      assignedToId?: string | null;
      workOrderId?: string | null;
      incidentId?: string | null;
      sponsorshipId?: string | null;
    };
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    const current = await this.repo.getTaskOrThrow(
      params.taskId,
      params.organizationId,
    );

    const data = params.data;
    const assigneeId = data.assigneeId ?? data.assignedToId;
    const relatedWorkOrderId = data.relatedWorkOrderId ?? data.workOrderId;
    const relatedIncidentId = data.relatedIncidentId ?? data.incidentId;
    const relatedSponsorshipId =
      data.relatedSponsorshipId ?? data.sponsorshipId;
    const dueDateInput = this.getDateInput({
      dueDate: data.dueDate,
      dueAt: data.dueAt,
    });

    await this.assertRelations({
      organizationId: params.organizationId,
      eventId: data.eventId,
      zoneId: data.zoneId,
      relatedWorkOrderId,
      relatedIncidentId,
      improvementId: data.improvementId,
      relatedSponsorshipId,
      assigneeId,
    });

    const patch: Prisma.TaskUncheckedUpdateInput = {};

    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.description !== undefined) {
      patch.description = data.description?.trim() ?? null;
    }
    if (data.type !== undefined) patch.type = data.type;
    if (data.status !== undefined) patch.status = data.status;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (dueDateInput !== undefined) {
      patch.dueAt = dueDateInput ? new Date(dueDateInput) : null;
    }
    if (data.eventId !== undefined) patch.eventId = data.eventId ?? null;
    if (data.zoneId !== undefined) patch.zoneId = data.zoneId ?? null;
    if (relatedWorkOrderId !== undefined) patch.workOrderId = relatedWorkOrderId ?? null;
    if (relatedIncidentId !== undefined) patch.incidentId = relatedIncidentId ?? null;
    if (data.improvementId !== undefined) patch.improvementId = data.improvementId ?? null;
    if (relatedSponsorshipId !== undefined) {
      patch.sponsorshipId = relatedSponsorshipId ?? null;
    }
    if (data.relatedLabel !== undefined) patch.relatedLabel = data.relatedLabel?.trim() ?? null;
    if (assigneeId !== undefined) patch.assignedToId = assigneeId ?? null;

    if (data.status === TaskStatus.DONE && !current.completedAt) {
      patch.completedAt = new Date();
    }
    if (data.status && data.status !== TaskStatus.DONE) {
      patch.completedAt = null;
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

    const hasNonStatusChanges = Object.keys(patch).some(
      (key) => key !== "status" && key !== "completedAt",
    );
    if (hasNonStatusChanges) {
      await this.audit.log({
        organizationId: params.organizationId,
        eventId: updated.eventId ?? null,
        userId: params.performedByUserId ?? null,
        entityType: AuditEntityType.TASK,
        entityId: updated.id,
        action: AuditActionType.UPDATED,
        message: "Task updated",
        changes: patch,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      });
    }

    return this.mapTask(updated);
  }

  async moveTask(params: {
    organizationId: string;
    taskId: string;
    newStatus: TaskStatus;
    overTaskId?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    const current = await this.repo.getTaskOrThrow(
      params.taskId,
      params.organizationId,
    );

    if (params.overTaskId) {
      await this.repo.getTaskOrThrow(params.overTaskId, params.organizationId);
    }

    if (current.status === params.newStatus) {
      return this.mapTask(current);
    }

    const updated = await this.repo.updateTask({
      taskId: params.taskId,
      data: {
        status: params.newStatus,
        completedAt: params.newStatus === TaskStatus.DONE ? new Date() : null,
      },
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: updated.eventId ?? null,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.TASK,
      entityId: updated.id,
      action: AuditActionType.STATUS_CHANGED,
      message: `Task moved from ${current.status} to ${updated.status}`,
      changes: {
        fromStatus: current.status,
        toStatus: updated.status,
        overTaskId: params.overTaskId ?? null,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.mapTask(updated);
  }

  async addComment(params: {
    organizationId: string;
    taskId: string;
    authorId?: string | null;
    message?: string;
    body?: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    if (!params.authorId) {
      throw new BadRequestException("authorId is required");
    }

    const message = (params.message ?? params.body ?? "").trim();
    if (!message) {
      throw new BadRequestException("message is required");
    }

    const task = await this.repo.getTaskOrThrow(params.taskId, params.organizationId);

    await this.repo.addComment({
      taskId: params.taskId,
      authorId: params.authorId,
      body: message,
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: task.eventId ?? null,
      userId: params.authorId,
      entityType: AuditEntityType.TASK,
      entityId: task.id,
      action: AuditActionType.UPDATED,
      message: "Task comment added",
      changes: { kind: "comment_created" },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    // Contrato elegido: devolvemos la task completa para refrescar board en un roundtrip.
    const updatedTask = await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    return this.mapTask(updatedTask);
  }

  async listComments(params: {
    organizationId: string;
    taskId: string;
  }): Promise<TaskCommentResponseDto[]> {
    await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    const comments = await this.repo.listComments(params.taskId);
    return comments.map((comment) => this.mapComment(comment));
  }

  async addChecklistItem(params: {
    organizationId: string;
    taskId: string;
    text: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    const task = await this.repo.getTaskOrThrow(params.taskId, params.organizationId);

    await this.repo.createChecklistItem({
      taskId: params.taskId,
      text: params.text.trim(),
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: task.eventId ?? null,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.TASK,
      entityId: task.id,
      action: AuditActionType.UPDATED,
      message: "Task checklist item created",
      changes: { kind: "checklist_item_created" },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    const updatedTask = await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    return this.mapTask(updatedTask);
  }

  async toggleChecklistItem(params: {
    organizationId: string;
    taskId: string;
    itemId: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    const task = await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    const item = await this.repo.getChecklistItemOrThrow({
      taskId: params.taskId,
      organizationId: params.organizationId,
      itemId: params.itemId,
    });

    await this.repo.updateChecklistItem({
      itemId: params.itemId,
      data: { done: !item.done },
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: task.eventId ?? null,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.TASK,
      entityId: task.id,
      action: AuditActionType.STATUS_CHANGED,
      message: "Task checklist item toggled",
      changes: {
        kind: "checklist_item_toggled",
        itemId: item.id,
        fromDone: item.done,
        toDone: !item.done,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    const updatedTask = await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    return this.mapTask(updatedTask);
  }
}
