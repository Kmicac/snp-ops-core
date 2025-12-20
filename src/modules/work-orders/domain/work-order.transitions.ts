import { BadRequestException } from "@nestjs/common";
import { WorkOrderStatus } from "@prisma/client";

const allowed: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  SCHEDULED: ["ACCEPTED", "CANCELED"],
  ACCEPTED: ["IN_PROGRESS", "DELAYED", "CANCELED"],
  IN_PROGRESS: ["COMPLETED", "DELAYED", "CANCELED"],
  DELAYED: ["IN_PROGRESS", "COMPLETED", "CANCELED"],
  COMPLETED: [],
  CANCELED: [],
};

export function assertWorkOrderTransition(from: WorkOrderStatus, to: WorkOrderStatus) {
  if (from === to) return;
  if (!allowed[from]?.includes(to)) {
    throw new BadRequestException(`Invalid transition: ${from} -> ${to}`);
  }
}
