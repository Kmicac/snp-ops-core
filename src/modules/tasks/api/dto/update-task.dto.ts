import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  eventId?: string | null;

  @IsOptional()
  @IsString()
  zoneId?: string | null;

  @IsOptional()
  @IsString()
  workOrderId?: string | null;

  @IsOptional()
  @IsString()
  incidentId?: string | null;

  @IsOptional()
  @IsString()
  improvementId?: string | null;

  @IsOptional()
  @IsString()
  sponsorshipId?: string | null;

  @IsOptional()
  @IsString()
  assignedToId?: string | null;
}
