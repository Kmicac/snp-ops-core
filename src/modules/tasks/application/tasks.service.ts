import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AuditActionType,
  AuditEntityType,
  Prisma,
  TaskActivityKind,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import { AuditService } from "src/modules/audit/application/audit.service";
import {
  TaskActivityResponseDto,
  TaskCommentResponseDto,
  TaskResponseDto,
} from "../api/dto/task-response.dto";
import { TaskWithRelations, TasksRepository } from "../infrastructure/tasks.repo";
import { StaffRepo } from "src/modules/staff/infrastructure/staff.repo";

type MoveTaskResult = {
  previousStatus: TaskStatus;
  previousPosition: number;
  finalStatus: TaskStatus;
  finalPosition: number;
  moved: boolean;
  statusChanged: boolean;
  task: TaskWithRelations;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly repo: TasksRepository,
    private readonly audit: AuditService,
    private readonly staffRepo: StaffRepo,
  ) {}

  private mapComment(comment: {
    id: string;
    authorId: string;
    body: string;
    message: string | null;
    imageUrl: string | null;
    imageKey: string | null;
    createdAt: Date;
    author: { fullName: string | null; email: string } | null;
  }): TaskCommentResponseDto {
    return {
      id: comment.id,
      authorId: comment.authorId,
      authorName: comment.author?.fullName ?? comment.author?.email ?? "Unknown",
      authorAvatarUrl: null,
      message: comment.message ?? comment.body,
      imageUrl: comment.imageUrl,
      imageKey: comment.imageKey,
      createdAt: comment.createdAt,
    };
  }

  private mapActivity(activity: {
    id: string;
    kind: TaskActivityKind;
    message: string | null;
    imageUrl: string | null;
    imageKey: string | null;
    createdById: string | null;
    createdAt: Date;
    createdBy: { fullName: string | null; email: string } | null;
  }): TaskActivityResponseDto {
    return {
      id: activity.id,
      kind: activity.kind,
      message: activity.message,
      imageUrl: activity.imageUrl,
      imageKey: activity.imageKey,
      createdById: activity.createdById,
      createdByName: activity.createdBy?.fullName ?? activity.createdBy?.email ?? null,
      createdAt: activity.createdAt,
    };
  }

  private mergeLabels(
    labels?: string[] | null,
    relatedLabel?: string | null,
  ): string[] {
    const normalized = (labels ?? [])
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (relatedLabel?.trim()) {
      normalized.push(relatedLabel.trim());
    }

    return [...new Set(normalized)];
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
      labels: this.mergeLabels(task.labels, task.relatedLabel),
      position: task.position,
      imageUrl: task.imageUrl,
      imageKey: task.imageKey,
      assigneeId: task.assignedToId,
      assigneeName: task.assignedTo?.fullName ?? task.assignedTo?.email ?? null,
      assigneeAvatarUrl: null,
      assigneeStaffMemberId: task.assignedStaffMemberId,
      assigneeStaffMemberName: task.assignedStaffMember?.fullName ?? null,
      assigneeStaffMemberAvatarUrl: null,
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

  private clampPosition(position: number, max: number): number {
    return Math.min(Math.max(position, 0), max);
  }

  private async assertStaffMemberInOrg(staffMemberId: string, organizationId: string) {
    const staffMember = await this.staffRepo.findByIdAndOrganizationId(
      staffMemberId,
      organizationId,
    );

    if (!staffMember) {
      throw new BadRequestException(
        "assigneeStaffMemberId must belong to the same organization as the task",
      );
    }

    return staffMember;
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
    assigneeStaffMemberId?: string | null;
    tx?: Prisma.TransactionClient;
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
      assigneeStaffMemberId,
      tx,
    } = params;

    if (eventId) await this.repo.assertEventInOrg(eventId, organizationId, tx);
    if (zoneId) await this.repo.assertZoneInOrg(zoneId, organizationId, tx);
    if (improvementId) await this.repo.assertImprovementInOrg(improvementId, organizationId, tx);
    if (assigneeId) await this.repo.assertAssigneeInOrg(assigneeId, organizationId, tx);
    if (assigneeStaffMemberId) {
      await this.assertStaffMemberInOrg(assigneeStaffMemberId, organizationId);
    }

    if (relatedWorkOrderId) {
      const workOrder = await this.repo.getWorkOrderScopeInOrg(
        relatedWorkOrderId,
        organizationId,
        tx,
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
        tx,
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
        tx,
      );
      if (eventId && sponsorship.eventId !== eventId) {
        throw new BadRequestException(
          "relatedSponsorshipId must belong to the same eventId",
        );
      }
    }
  }

  private async moveTaskInTransaction(params: {
    tx: Prisma.TransactionClient;
    organizationId: string;
    taskId: string;
    targetStatus: TaskStatus;
    position?: number;
    beforeTaskId?: string;
    afterTaskId?: string;
    overTaskId?: string;
    createdById?: string | null;
    createActivity: boolean;
  }): Promise<MoveTaskResult> {
    if (params.beforeTaskId && params.afterTaskId) {
      throw new BadRequestException("beforeTaskId and afterTaskId are mutually exclusive");
    }

    const current = await this.repo.getTaskScopeOrThrow(
      params.taskId,
      params.organizationId,
      params.tx,
    );

    const sourceLane = await this.repo.listTasksInLane(
      params.organizationId,
      current.status,
      params.tx,
    );

    const destinationLaneBase =
      current.status === params.targetStatus
        ? sourceLane
        : await this.repo.listTasksInLane(
            params.organizationId,
            params.targetStatus,
            params.tx,
          );

    const destinationWithoutCurrent = destinationLaneBase.filter(
      (task) => task.id !== current.id,
    );

    const findIndexById = (taskId?: string): number => {
      if (!taskId) return -1;
      return destinationWithoutCurrent.findIndex((task) => task.id === taskId);
    };

    const beforeIndex = findIndexById(params.beforeTaskId);
    if (params.beforeTaskId && beforeIndex < 0) {
      throw new BadRequestException("beforeTaskId must belong to the target status lane");
    }

    const afterIndex = findIndexById(params.afterTaskId);
    if (params.afterTaskId && afterIndex < 0) {
      throw new BadRequestException("afterTaskId must belong to the target status lane");
    }

    const overIndex = findIndexById(params.overTaskId);
    if (params.overTaskId && overIndex < 0) {
      throw new BadRequestException("overTaskId must belong to the target status lane");
    }

    const targetPosition = (() => {
      if (beforeIndex >= 0) return beforeIndex;
      if (afterIndex >= 0) return afterIndex + 1;
      if (overIndex >= 0) return overIndex;
      if (params.position !== undefined && params.position !== null) {
        return this.clampPosition(params.position, destinationWithoutCurrent.length);
      }
      if (current.status === params.targetStatus) {
        return this.clampPosition(current.position, destinationWithoutCurrent.length);
      }
      return destinationWithoutCurrent.length;
    })();

    const reorderedDestination = [...destinationWithoutCurrent];
    reorderedDestination.splice(targetPosition, 0, current);

    if (current.status !== params.targetStatus) {
      const reorderedSource = sourceLane.filter((task) => task.id !== current.id);
      for (const [index, task] of reorderedSource.entries()) {
        if (task.position !== index) {
          await params.tx.task.update({
            where: { id: task.id },
            data: { position: index },
            select: { id: true },
          });
        }
      }
    }

    for (const [index, task] of reorderedDestination.entries()) {
      if (task.id === current.id) continue;
      if (task.position !== index) {
        await params.tx.task.update({
          where: { id: task.id },
          data: { position: index },
          select: { id: true },
        });
      }
    }

    const finalCompletedAt =
      params.targetStatus === TaskStatus.DONE
        ? (current.completedAt ?? new Date())
        : null;

    const completedAtChanged =
      (current.completedAt?.getTime() ?? null) !== (finalCompletedAt?.getTime() ?? null);
    const moved =
      current.status !== params.targetStatus ||
      current.position !== targetPosition ||
      completedAtChanged;

    if (moved) {
      await params.tx.task.update({
        where: { id: current.id },
        data: {
          status: params.targetStatus,
          position: targetPosition,
          completedAt: finalCompletedAt,
        },
        select: { id: true },
      });

      if (params.createActivity) {
        const message =
          current.status !== params.targetStatus
            ? `Task moved from ${current.status} to ${params.targetStatus} (${current.position} -> ${targetPosition})`
            : `Task reordered in ${params.targetStatus} (${current.position} -> ${targetPosition})`;

        await this.repo.createTaskActivity(
          {
            organizationId: params.organizationId,
            taskId: current.id,
            kind: TaskActivityKind.UPDATE,
            message,
            createdById: params.createdById ?? null,
          },
          params.tx,
        );
      }
    }

    const task = await this.repo.getTaskOrThrow(current.id, params.organizationId, params.tx);

    return {
      previousStatus: current.status,
      previousPosition: current.position,
      finalStatus: params.targetStatus,
      finalPosition: targetPosition,
      moved,
      statusChanged: current.status !== params.targetStatus,
      task,
    };
  }

  async createTask(params: {
    organizationId: string;
    createdById?: string | null;
    title: string;
    description?: string;
    type?: TaskType;
    status?: TaskStatus;
    priority?: TaskPriority;
    labels?: string[];
    imageUrl?: string;
    imageKey?: string;
    position?: number;
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
    assigneeStaffMemberId?: string | null;
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
    const createdById = params.createdById;

    const eventId = params.eventId ?? undefined;
    const assigneeId = params.assigneeId ?? params.assignedToId ?? undefined;
    const assigneeStaffMemberId = params.assigneeStaffMemberId ?? undefined;
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
      assigneeStaffMemberId,
    });

    const status = params.status ?? TaskStatus.TODO;
    const now = new Date();

    const created = await this.repo.withTransaction(async (tx) => {
      const laneSize = await tx.task.count({
        where: {
          organizationId: params.organizationId,
          status,
        },
      });

      const insertPosition = this.clampPosition(
        params.position ?? laneSize,
        laneSize,
      );

      await tx.task.updateMany({
        where: {
          organizationId: params.organizationId,
          status,
          position: { gte: insertPosition },
        },
        data: {
          position: { increment: 1 },
        },
      });

      return this.repo.createTask(
        {
          organizationId: params.organizationId,
          eventId: eventId ?? null,
          zoneId: params.zoneId ?? null,
          workOrderId: relatedWorkOrderId ?? null,
          incidentId: relatedIncidentId ?? null,
          improvementId: params.improvementId ?? null,
          sponsorshipId: relatedSponsorshipId ?? null,
          relatedLabel: params.relatedLabel?.trim() ?? null,
          labels: this.mergeLabels(params.labels, params.relatedLabel),
          title: params.title.trim(),
          description: params.description?.trim() ?? null,
          type: params.type ?? TaskType.GENERAL,
          status,
          priority: params.priority ?? TaskPriority.MEDIUM,
          position: insertPosition,
          imageUrl: params.imageUrl?.trim() ?? null,
          imageKey: params.imageKey?.trim() ?? null,
          dueAt: dueDateInput ? new Date(dueDateInput) : null,
          completedAt: status === TaskStatus.DONE ? now : null,
          createdById,
          assignedToId: assigneeId ?? null,
          assignedStaffMemberId: assigneeStaffMemberId ?? null,
          createdAt: now,
          updatedAt: now,
        },
        tx,
      );
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: created.eventId ?? null,
      userId: createdById,
      entityType: AuditEntityType.TASK,
      entityId: created.id,
      action: AuditActionType.CREATED,
      message: `Task created: ${created.title}`,
      changes: {
        status: created.status,
        priority: created.priority,
        assigneeId: created.assignedToId,
        assigneeStaffMemberId: created.assignedStaffMemberId,
        position: created.position,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.mapTask(created);
  }

  async listTasksByOrg(params: {
    organizationId: string;
    eventId?: string;
    status?: TaskStatus[];
    priority?: TaskPriority;
    type?: TaskType[];
    labels?: string[];
    assigneeId?: string;
    assigneeStaffMemberId?: string;
    search?: string;
  }): Promise<TaskResponseDto[]> {
    const tasks = await this.repo.listTasksByOrg({
      organizationId: params.organizationId,
      eventId: params.eventId,
      statuses: params.status,
      priority: params.priority,
      types: params.type,
      labels: params.labels,
      assigneeId: params.assigneeId,
      assigneeStaffMemberId: params.assigneeStaffMemberId,
      search: params.search,
    });

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
      labels?: string[] | null;
      imageUrl?: string | null;
      imageKey?: string | null;
      position?: number | null;
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
      assigneeStaffMemberId?: string | null;
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
    const dueDateInput = this.getDateInput({
      dueDate: data.dueDate,
      dueAt: data.dueAt,
    });

    const nextEventId = data.eventId !== undefined ? data.eventId : current.eventId;
    const nextZoneId = data.zoneId !== undefined ? data.zoneId : current.zoneId;
    const nextAssigneeId =
      data.assigneeId !== undefined
        ? data.assigneeId
        : data.assignedToId !== undefined
          ? data.assignedToId
          : current.assignedToId;
    const nextAssigneeStaffMemberId =
      data.assigneeStaffMemberId !== undefined
        ? data.assigneeStaffMemberId
        : current.assignedStaffMemberId;
    const nextWorkOrderId =
      data.relatedWorkOrderId !== undefined
        ? data.relatedWorkOrderId
        : data.workOrderId !== undefined
          ? data.workOrderId
          : current.workOrderId;
    const nextIncidentId =
      data.relatedIncidentId !== undefined
        ? data.relatedIncidentId
        : data.incidentId !== undefined
          ? data.incidentId
          : current.incidentId;
    const nextSponsorshipId =
      data.relatedSponsorshipId !== undefined
        ? data.relatedSponsorshipId
        : data.sponsorshipId !== undefined
          ? data.sponsorshipId
          : current.sponsorshipId;
    const nextImprovementId =
      data.improvementId !== undefined ? data.improvementId : current.improvementId;

    await this.assertRelations({
      organizationId: params.organizationId,
      eventId: nextEventId,
      zoneId: nextZoneId,
      relatedWorkOrderId: nextWorkOrderId,
      relatedIncidentId: nextIncidentId,
      improvementId: nextImprovementId,
      relatedSponsorshipId: nextSponsorshipId,
      assigneeId: nextAssigneeId,
      assigneeStaffMemberId: nextAssigneeStaffMemberId,
    });

    const patch: Prisma.TaskUncheckedUpdateInput = {};

    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.description !== undefined) {
      patch.description = data.description?.trim() ?? null;
    }
    if (data.type !== undefined) patch.type = data.type;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (dueDateInput !== undefined) {
      patch.dueAt = dueDateInput ? new Date(dueDateInput) : null;
    }
    if (data.eventId !== undefined) patch.eventId = data.eventId ?? null;
    if (data.zoneId !== undefined) patch.zoneId = data.zoneId ?? null;

    if (data.relatedWorkOrderId !== undefined || data.workOrderId !== undefined) {
      patch.workOrderId = nextWorkOrderId ?? null;
    }
    if (data.relatedIncidentId !== undefined || data.incidentId !== undefined) {
      patch.incidentId = nextIncidentId ?? null;
    }
    if (data.improvementId !== undefined) patch.improvementId = data.improvementId ?? null;
    if (data.relatedSponsorshipId !== undefined || data.sponsorshipId !== undefined) {
      patch.sponsorshipId = nextSponsorshipId ?? null;
    }

    if (data.relatedLabel !== undefined) {
      patch.relatedLabel = data.relatedLabel?.trim() ?? null;
    }

    if (data.labels !== undefined) {
      patch.labels = this.mergeLabels(data.labels, data.relatedLabel ?? undefined);
    } else if (data.relatedLabel !== undefined && data.relatedLabel?.trim()) {
      patch.labels = this.mergeLabels(current.labels, data.relatedLabel);
    }

    if (nextAssigneeId !== current.assignedToId) {
      patch.assignedToId = nextAssigneeId ?? null;
    }
    if (nextAssigneeStaffMemberId !== current.assignedStaffMemberId) {
      patch.assignedStaffMemberId = nextAssigneeStaffMemberId ?? null;
    }

    if (data.imageUrl !== undefined) {
      patch.imageUrl = data.imageUrl?.trim() ?? null;
    }

    if (data.imageKey !== undefined) {
      patch.imageKey = data.imageKey?.trim() ?? null;
    }

    const hasNonOrderChanges = Object.keys(patch).length > 0;
    const assigneeStaffMemberChanged =
      nextAssigneeStaffMemberId !== current.assignedStaffMemberId;
    const shouldMove = data.status !== undefined || data.position !== undefined;

    const result = await this.repo.withTransaction(async (tx) => {
      if (hasNonOrderChanges) {
        await tx.task.update({
          where: { id: params.taskId },
          data: patch,
          select: { id: true },
        });
      }

      let moveResult: MoveTaskResult | null = null;

      if (shouldMove) {
        const targetTask = await this.repo.getTaskScopeOrThrow(
          params.taskId,
          params.organizationId,
          tx,
        );

        moveResult = await this.moveTaskInTransaction({
          tx,
          organizationId: params.organizationId,
          taskId: params.taskId,
          targetStatus: data.status ?? targetTask.status,
          position:
            data.position === null || data.position === undefined
              ? undefined
              : data.position,
          createdById: params.performedByUserId,
          createActivity: true,
        });
      }

      if (hasNonOrderChanges) {
        await this.repo.createTaskActivity(
          {
            organizationId: params.organizationId,
            taskId: params.taskId,
            kind: TaskActivityKind.UPDATE,
            message: "Task updated",
            createdById: params.performedByUserId ?? null,
          },
          tx,
        );
      }

      if (assigneeStaffMemberChanged) {
        await this.repo.createTaskActivity(
          {
            organizationId: params.organizationId,
            taskId: params.taskId,
            kind: TaskActivityKind.ASSIGNEE_CHANGED,
            message: `Staff assignee changed from ${current.assignedStaffMemberId ?? "null"} to ${nextAssigneeStaffMemberId ?? "null"}`,
            createdById: params.performedByUserId ?? null,
          },
          tx,
        );
      }

      const task = moveResult
        ? moveResult.task
        : await this.repo.getTaskOrThrow(params.taskId, params.organizationId, tx);

      return { moveResult, task };
    });

    if (result.moveResult?.statusChanged) {
      await this.audit.log({
        organizationId: params.organizationId,
        eventId: result.task.eventId ?? null,
        userId: params.performedByUserId ?? null,
        entityType: AuditEntityType.TASK,
        entityId: result.task.id,
        action: AuditActionType.STATUS_CHANGED,
        message: `Task status changed from ${result.moveResult.previousStatus} to ${result.moveResult.finalStatus}`,
        changes: {
          fromStatus: result.moveResult.previousStatus,
          toStatus: result.moveResult.finalStatus,
          fromPosition: result.moveResult.previousPosition,
          toPosition: result.moveResult.finalPosition,
        },
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      });
    }

    if (hasNonOrderChanges || result.moveResult?.moved) {
      await this.audit.log({
        organizationId: params.organizationId,
        eventId: result.task.eventId ?? null,
        userId: params.performedByUserId ?? null,
        entityType: AuditEntityType.TASK,
        entityId: result.task.id,
        action: AuditActionType.UPDATED,
        message: "Task updated",
        changes: {
          ...patch,
          ...(result.moveResult
            ? {
                fromStatus: result.moveResult.previousStatus,
                toStatus: result.moveResult.finalStatus,
                fromPosition: result.moveResult.previousPosition,
                toPosition: result.moveResult.finalPosition,
              }
            : {}),
        },
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      });
    }

    return this.mapTask(result.task);
  }

  async moveTask(params: {
    organizationId: string;
    taskId: string;
    newStatus?: TaskStatus;
    position?: number;
    beforeTaskId?: string;
    afterTaskId?: string;
    overTaskId?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    if (!params.newStatus) {
      throw new BadRequestException("status is required");
    }
    const targetStatus = params.newStatus;

    const result = await this.repo.withTransaction((tx) =>
      this.moveTaskInTransaction({
        tx,
        organizationId: params.organizationId,
        taskId: params.taskId,
        targetStatus,
        position: params.position,
        beforeTaskId: params.beforeTaskId,
        afterTaskId: params.afterTaskId,
        overTaskId: params.overTaskId,
        createdById: params.performedByUserId,
        createActivity: true,
      }),
    );

    if (result.statusChanged) {
      await this.audit.log({
        organizationId: params.organizationId,
        eventId: result.task.eventId ?? null,
        userId: params.performedByUserId ?? null,
        entityType: AuditEntityType.TASK,
        entityId: result.task.id,
        action: AuditActionType.STATUS_CHANGED,
        message: `Task moved from ${result.previousStatus} to ${result.finalStatus}`,
        changes: {
          fromStatus: result.previousStatus,
          toStatus: result.finalStatus,
          fromPosition: result.previousPosition,
          toPosition: result.finalPosition,
          beforeTaskId: params.beforeTaskId ?? null,
          afterTaskId: params.afterTaskId ?? null,
          overTaskId: params.overTaskId ?? null,
        },
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      });
    } else if (result.moved) {
      await this.audit.log({
        organizationId: params.organizationId,
        eventId: result.task.eventId ?? null,
        userId: params.performedByUserId ?? null,
        entityType: AuditEntityType.TASK,
        entityId: result.task.id,
        action: AuditActionType.UPDATED,
        message: "Task reordered",
        changes: {
          status: result.finalStatus,
          fromPosition: result.previousPosition,
          toPosition: result.finalPosition,
          beforeTaskId: params.beforeTaskId ?? null,
          afterTaskId: params.afterTaskId ?? null,
          overTaskId: params.overTaskId ?? null,
        },
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      });
    }

    return this.mapTask(result.task);
  }

  async listActivity(params: {
    organizationId: string;
    taskId: string;
  }): Promise<TaskActivityResponseDto[]> {
    await this.repo.getTaskOrThrow(params.taskId, params.organizationId);
    const activity = await this.repo.listTaskActivity(params);
    return activity.map((entry) => this.mapActivity(entry));
  }

  async addComment(params: {
    organizationId: string;
    taskId: string;
    authorId?: string | null;
    message?: string;
    body?: string;
    imageUrl?: string;
    imageKey?: string;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<TaskResponseDto> {
    if (!params.authorId) {
      throw new BadRequestException("authorId is required");
    }

    const message = (params.message ?? params.body ?? "").trim();
    const imageUrl = params.imageUrl?.trim() ?? null;
    const imageKey = params.imageKey?.trim() ?? null;

    if (!message && !imageUrl) {
      throw new BadRequestException("message or imageUrl is required");
    }

    const updatedTask = await this.repo.withTransaction(async (tx) => {
      const task = await this.repo.getTaskOrThrow(params.taskId, params.organizationId, tx);

      await this.repo.addComment(
        {
          taskId: params.taskId,
          authorId: params.authorId!,
          body: message,
          message: message || null,
          imageUrl,
          imageKey,
        },
        tx,
      );

      await this.repo.createTaskActivity(
        {
          organizationId: params.organizationId,
          taskId: params.taskId,
          kind: TaskActivityKind.COMMENT,
          message: message || null,
          imageUrl,
          imageKey,
          createdById: params.authorId,
        },
        tx,
      );

      return this.repo.getTaskOrThrow(task.id, params.organizationId, tx);
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: updatedTask.eventId ?? null,
      userId: params.authorId,
      entityType: AuditEntityType.TASK,
      entityId: updatedTask.id,
      action: AuditActionType.UPDATED,
      message: "Task comment added",
      changes: {
        kind: "comment_created",
        hasImage: !!imageUrl,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

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
