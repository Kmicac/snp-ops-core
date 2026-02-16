import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
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
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 40, { each: true })
  labels?: string[] | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  imageKey?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number | null;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  eventId?: string | null;

  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsString()
  relatedWorkOrderId?: string | null;

  @IsOptional()
  @IsString()
  relatedIncidentId?: string | null;

  @IsOptional()
  @IsString()
  relatedSponsorshipId?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  relatedLabel?: string | null;

  // Campos legacy para compatibilidad hacia atrás.
  @IsOptional()
  @IsDateString()
  dueAt?: string | null;

  @IsOptional()
  @IsString()
  assignedToId?: string | null;

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
}
