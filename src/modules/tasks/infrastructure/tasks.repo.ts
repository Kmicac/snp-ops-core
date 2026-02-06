import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { Prisma, TaskStatus } from "@prisma/client";

const taskInclude = {
  createdBy: true,
  assignedTo: true,
  event: true,
  zone: true,
  workOrder: true,
  incident: true,
  improvement: true,
  sponsorship: true,
};

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

  async assertWorkOrderInOrg(workOrderId: string, organizationId: string) {
    await this.prisma.workOrder.findFirstOrThrow({
      where: { id: workOrderId, event: { organizationId } },
      select: { id: true },
    });
  }

  async assertIncidentInOrg(incidentId: string, organizationId: string) {
    await this.prisma.incident.findFirstOrThrow({
      where: { id: incidentId, event: { organizationId } },
      select: { id: true },
    });
  }

  async assertImprovementInOrg(improvementId: string, organizationId: string) {
    await this.prisma.improvement.findFirstOrThrow({
      where: { id: improvementId, organizationId },
      select: { id: true },
    });
  }

  async assertSponsorshipInOrg(sponsorshipId: string, organizationId: string) {
    await this.prisma.sponsorship.findFirstOrThrow({
      where: { id: sponsorshipId, organizationId },
      select: { id: true },
    });
  }

  createTask(data: Prisma.TaskUncheckedCreateInput) {
    return this.prisma.task.create({
      data,
      include: taskInclude,
    });
  }

  listTasksByOrg(params: {
    organizationId: string;
    eventId?: string;
    status?: TaskStatus;
    assignedToId?: string;
  }) {
    const where: Prisma.TaskWhereInput = {
      organizationId: params.organizationId,
      ...(params.eventId ? { eventId: params.eventId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
    };

    return this.prisma.task.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      include: taskInclude,
    });
  }

  getTaskOrThrow(taskId: string, organizationId: string) {
    return this.prisma.task.findFirstOrThrow({
      where: { id: taskId, organizationId },
      include: taskInclude,
    });
  }

  updateTask(params: {
    taskId: string;
    data: Prisma.TaskUncheckedUpdateInput;
  }) {
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
}
