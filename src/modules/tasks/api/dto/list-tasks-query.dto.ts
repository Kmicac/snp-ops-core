import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class ListTasksQueryDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
