import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  title!: string;

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
  dueDate?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  relatedWorkOrderId?: string;

  @IsOptional()
  @IsString()
  relatedIncidentId?: string;

  @IsOptional()
  @IsString()
  relatedSponsorshipId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  relatedLabel?: string;

  // Campos legacy para compatibilidad hacia atrás.
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  workOrderId?: string;

  @IsOptional()
  @IsString()
  incidentId?: string;

  @IsOptional()
  @IsString()
  improvementId?: string;

  @IsOptional()
  @IsString()
  sponsorshipId?: string;
}
