import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

export type TaskChecklistItemResponseDto = {
  id: string;
  text: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskCommentResponseDto = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  message: string;
  createdAt: Date;
};

export type TaskResponseDto = {
  id: string;
  orgId: string;
  organizationId: string;
  eventId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeAvatarUrl: string | null;
  dueDate: Date | null;
  relatedWorkOrderId: string | null;
  relatedIncidentId: string | null;
  relatedSponsorshipId: string | null;
  relatedLabel: string | null;
  checklist: TaskChecklistItemResponseDto[];
  checklistDone: number;
  checklistTotal: number;
  comments: TaskCommentResponseDto[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
};
