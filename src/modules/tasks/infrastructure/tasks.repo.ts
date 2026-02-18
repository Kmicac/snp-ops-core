import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  Prisma,
  TaskActivityKind,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";

const taskCommentInclude = Prisma.validator<Prisma.TaskCommentInclude>()({
  author: true,
});

export const taskInclude = Prisma.validator<Prisma.TaskInclude>()({
  createdBy: true,
  assignedToStaffMember: true,
  event: true,
  zone: true,
  workOrder: true,
  incident: true,
  improvement: true,
  sponsorship: true,
  comments: {
    include: taskCommentInclude,
    orderBy: { createdAt: "asc" },
  },
  checklist: {
    orderBy: { createdAt: "asc" },
  },
});

const taskActivityInclude = Prisma.validator<Prisma.TaskActivityInclude>()({
  createdBy: true,
});

const laneTaskSelect = Prisma.validator<Prisma.TaskSelect>()({
  id: true,
  status: true,
  position: true,
  createdAt: true,
  completedAt: true,
});

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

export type TaskActivityWithRelations = Prisma.TaskActivityGetPayload<{
  include: typeof taskActivityInclude;
}>;

export type LaneTask = Prisma.TaskGetPayload<{
  select: typeof laneTaskSelect;
}>;

type Tx = Prisma.TransactionClient;

type ListTasksParams = {
  organizationId: string;
  eventId?: string;
  statuses?: TaskStatus[];
  priority?: TaskPriority;
  types?: TaskType[];
  assigneeId?: string;
  labels?: string[];
  search?: string;
};

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  withTransaction<T>(callback: (tx: Tx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => callback(tx), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async assertEventInOrg(eventId: string, organizationId: string, tx?: Tx) {
    await this.db(tx).event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
  }

  async assertZoneInOrg(zoneId: string, organizationId: string, tx?: Tx) {
    await this.getZoneScopeInOrg(zoneId, organizationId, tx);
  }

  getZoneScopeInOrg(zoneId: string, organizationId: string, tx?: Tx) {
    return this.db(tx).zone.findFirstOrThrow({
      where: { id: zoneId, event: { organizationId } },
      select: { id: true, eventId: true },
    });
  }

  async getWorkOrderScopeInOrg(workOrderId: string, organizationId: string, tx?: Tx) {
    return this.db(tx).workOrder.findFirstOrThrow({
      where: { id: workOrderId, event: { organizationId } },
      select: { id: true, eventId: true },
    });
  }

  async getIncidentScopeInOrg(incidentId: string, organizationId: string, tx?: Tx) {
    return this.db(tx).incident.findFirstOrThrow({
      where: { id: incidentId, event: { organizationId } },
      select: { id: true, eventId: true },
    });
  }

  async assertImprovementInOrg(improvementId: string, organizationId: string, tx?: Tx) {
    await this.db(tx).improvement.findFirstOrThrow({
      where: { id: improvementId, organizationId },
      select: { id: true },
    });
  }

  async getSponsorshipScopeInOrg(sponsorshipId: string, organizationId: string, tx?: Tx) {
    return this.db(tx).sponsorship.findFirstOrThrow({
      where: { id: sponsorshipId, organizationId },
      select: { id: true, eventId: true },
    });
  }

  async assertAssigneeStaffInScope(
    staffMemberId: string,
    organizationId: string,
    eventId?: string | null,
    tx?: Tx,
  ) {
    const staff = await this.db(tx).staffMember.findFirst({
      where: {
        id: staffMemberId,
        organizationId,
      },
      select: { id: true },
    });

    if (!staff) {
      throw new NotFoundException("Assignee staff member not found in organization");
    }

    if (!eventId) return;

    const [assignment, eventResource] = await Promise.all([
      this.db(tx).staffAssignment.findFirst({
        where: {
          eventId,
          staffMemberId,
        },
        select: { id: true },
      }),
      this.db(tx).eventResource.findFirst({
        where: {
          organizationId,
          eventId,
          staffMemberId,
        },
        select: { id: true },
      }),
    ]);

    if (!assignment && !eventResource) {
      throw new ConflictException(
        "assigneeId must be assigned to the task event via staff assignment or event resource",
      );
    }
  }

  createTask(data: Prisma.TaskUncheckedCreateInput, tx?: Tx): Promise<TaskWithRelations> {
    return this.db(tx).task.create({
      data,
      include: taskInclude,
    });
  }

  async getLastTaskPosition(
    organizationId: string,
    status: TaskStatus,
    tx?: Tx,
  ): Promise<number> {
    const lastTask = await this.db(tx).task.findFirst({
      where: { organizationId, status },
      orderBy: [{ position: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      select: { position: true },
    });

    return lastTask?.position ?? -1;
  }

  async listTasksByOrg(params: ListTasksParams): Promise<TaskWithRelations[]> {
    const andFilters: Prisma.TaskWhereInput[] = [];

    if (params.labels && params.labels.length > 0) {
      andFilters.push({
        OR: [
          { labels: { hasSome: params.labels } },
          { relatedLabel: { in: params.labels } },
        ],
      });
    }

    if (params.search?.trim()) {
      const search = params.search.trim();
      andFilters.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { relatedLabel: { contains: search, mode: "insensitive" } },
          { labels: { has: search } },
        ],
      });
    }

    const where: Prisma.TaskWhereInput = {
      organizationId: params.organizationId,
      ...(params.eventId ? { eventId: params.eventId } : {}),
      ...(params.statuses && params.statuses.length > 0
        ? { status: { in: params.statuses } }
        : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.types && params.types.length > 0 ? { type: { in: params.types } } : {}),
      ...(params.assigneeId
        ? { assignedToStaffMemberId: params.assigneeId }
        : {}),
      ...(andFilters.length > 0 ? { AND: andFilters } : {}),
    };

    return this.prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { position: "asc" }, { updatedAt: "desc" }],
      include: taskInclude,
    });
  }

  getTaskOrThrow(taskId: string, organizationId: string, tx?: Tx): Promise<TaskWithRelations> {
    return this.db(tx).task.findFirstOrThrow({
      where: { id: taskId, organizationId },
      include: taskInclude,
    });
  }

  getTaskScopeOrThrow(
    taskId: string,
    organizationId: string,
    tx?: Tx,
  ): Promise<LaneTask & { eventId: string | null; title: string }> {
    return this.db(tx).task.findFirstOrThrow({
      where: { id: taskId, organizationId },
      select: {
        ...laneTaskSelect,
        eventId: true,
        title: true,
      },
    });
  }

  listTasksInLane(
    organizationId: string,
    status: TaskStatus,
    tx?: Tx,
  ): Promise<LaneTask[]> {
    return this.db(tx).task.findMany({
      where: { organizationId, status },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: laneTaskSelect,
    });
  }

  updateTask(params: {
    taskId: string;
    data: Prisma.TaskUncheckedUpdateInput;
    tx?: Tx;
  }): Promise<TaskWithRelations> {
    return this.db(params.tx).task.update({
      where: { id: params.taskId },
      data: params.data,
      include: taskInclude,
    });
  }

  updateTaskOrder(params: {
    taskId: string;
    status: TaskStatus;
    position: number;
    completedAt: Date | null;
    tx: Tx;
  }) {
    return params.tx.task.update({
      where: { id: params.taskId },
      data: {
        status: params.status,
        position: params.position,
        completedAt: params.completedAt,
      },
      select: { id: true },
    });
  }

  addComment(
    params: {
      taskId: string;
      authorId: string;
      body: string;
      message?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
    },
    tx?: Tx,
  ) {
    return this.db(tx).taskComment.create({
      data: {
        taskId: params.taskId,
        authorId: params.authorId,
        body: params.body,
        message: params.message ?? null,
        imageUrl: params.imageUrl ?? null,
        imageKey: params.imageKey ?? null,
      },
      include: taskCommentInclude,
    });
  }

  listComments(taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: taskCommentInclude,
    });
  }

  createTaskActivity(
    params: {
      organizationId: string;
      taskId: string;
      kind: TaskActivityKind;
      message?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
      createdById?: string | null;
    },
    tx?: Tx,
  ): Promise<TaskActivityWithRelations> {
    return this.db(tx).taskActivity.create({
      data: {
        organizationId: params.organizationId,
        taskId: params.taskId,
        kind: params.kind,
        message: params.message ?? null,
        imageUrl: params.imageUrl ?? null,
        imageKey: params.imageKey ?? null,
        createdById: params.createdById ?? null,
      },
      include: taskActivityInclude,
    });
  }

  listTaskActivity(params: {
    organizationId: string;
    taskId: string;
  }): Promise<TaskActivityWithRelations[]> {
    return this.prisma.taskActivity.findMany({
      where: {
        organizationId: params.organizationId,
        taskId: params.taskId,
      },
      orderBy: { createdAt: "asc" },
      include: taskActivityInclude,
    });
  }

  createChecklistItem(params: { taskId: string; text: string }) {
    return this.prisma.taskChecklistItem.create({
      data: {
        taskId: params.taskId,
        text: params.text,
      },
    });
  }

  getChecklistItemOrThrow(params: {
    taskId: string;
    organizationId: string;
    itemId: string;
  }) {
    return this.prisma.taskChecklistItem.findFirstOrThrow({
      where: {
        id: params.itemId,
        taskId: params.taskId,
        task: { organizationId: params.organizationId },
      },
    });
  }

  updateChecklistItem(params: {
    itemId: string;
    data: Prisma.TaskChecklistItemUpdateInput;
  }) {
    return this.prisma.taskChecklistItem.update({
      where: { id: params.itemId },
      data: params.data,
    });
  }
}
