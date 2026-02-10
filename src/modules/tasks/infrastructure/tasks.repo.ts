import { Injectable } from "@nestjs/common";
import { Prisma, TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";

export const taskInclude = Prisma.validator<Prisma.TaskInclude>()({
  createdBy: true,
  assignedTo: true,
  event: true,
  zone: true,
  workOrder: true,
  incident: true,
  improvement: true,
  sponsorship: true,
  comments: {
    include: { author: true },
    orderBy: { createdAt: "asc" },
  },
  checklist: {
    orderBy: { createdAt: "asc" },
  },
});

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: typeof taskInclude;
}>;

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async assertEventInOrg(eventId: string, organizationId: string) {
    await this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
  }

  async assertZoneInOrg(zoneId: string, organizationId: string) {
    await this.prisma.zone.findFirstOrThrow({
      where: { id: zoneId, event: { organizationId } },
      select: { id: true },
    });
  }

  async getWorkOrderScopeInOrg(workOrderId: string, organizationId: string) {
    return this.prisma.workOrder.findFirstOrThrow({
      where: { id: workOrderId, event: { organizationId } },
      select: { id: true, eventId: true },
    });
  }

  async getIncidentScopeInOrg(incidentId: string, organizationId: string) {
    return this.prisma.incident.findFirstOrThrow({
      where: { id: incidentId, event: { organizationId } },
      select: { id: true, eventId: true },
    });
  }

  async assertImprovementInOrg(improvementId: string, organizationId: string) {
    await this.prisma.improvement.findFirstOrThrow({
      where: { id: improvementId, organizationId },
      select: { id: true },
    });
  }

  async getSponsorshipScopeInOrg(sponsorshipId: string, organizationId: string) {
    return this.prisma.sponsorship.findFirstOrThrow({
      where: { id: sponsorshipId, organizationId },
      select: { id: true, eventId: true },
    });
  }

  async assertAssigneeInOrg(userId: string, organizationId: string) {
    await this.prisma.orgMembership.findFirstOrThrow({
      where: { userId, organizationId },
      select: { id: true },
    });
  }

  createTask(data: Prisma.TaskUncheckedCreateInput): Promise<TaskWithRelations> {
    return this.prisma.task.create({
      data,
      include: taskInclude,
    });
  }

  listTasksByOrg(params: {
    organizationId: string;
    eventId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    assigneeId?: string;
    search?: string;
  }): Promise<TaskWithRelations[]> {
    const where: Prisma.TaskWhereInput = {
      organizationId: params.organizationId,
      ...(params.eventId ? { eventId: params.eventId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.assigneeId ? { assignedToId: params.assigneeId } : {}),
      ...(params.search
        ? {
            OR: [
              { title: { contains: params.search, mode: "insensitive" } },
              { description: { contains: params.search, mode: "insensitive" } },
              { relatedLabel: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    return this.prisma.task.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: taskInclude,
    });
  }

  getTaskOrThrow(taskId: string, organizationId: string): Promise<TaskWithRelations> {
    return this.prisma.task.findFirstOrThrow({
      where: { id: taskId, organizationId },
      include: taskInclude,
    });
  }

  updateTask(params: {
    taskId: string;
    data: Prisma.TaskUncheckedUpdateInput;
  }): Promise<TaskWithRelations> {
    return this.prisma.task.update({
      where: { id: params.taskId },
      data: params.data,
      include: taskInclude,
    });
  }

  addComment(params: { taskId: string; authorId: string; body: string }) {
    return this.prisma.taskComment.create({
      data: {
        taskId: params.taskId,
        authorId: params.authorId,
        body: params.body,
      },
      include: { author: true },
    });
  }

  listComments(taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: "asc" },
      include: { author: true },
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
