import { Transform } from "class-transformer";
import { TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { IsArray, IsEnum, IsOptional, IsString } from "class-validator";

function parseQueryArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const raw = Array.isArray(value) ? value : [value];
  const normalized = raw
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    return undefined;
  }

  return [...new Set(normalized)];
}

export class ListTasksQueryDto {
  @IsOptional()
  @IsString()
  eventId?: string;

  @Transform(({ value }) => parseQueryArray(value))
  @IsOptional()
  @IsArray()
  @IsEnum(TaskStatus, { each: true })
  status?: TaskStatus[];

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  // Legacy single filter
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @Transform(({ value }) => parseQueryArray(value))
  @IsOptional()
  @IsArray()
  @IsEnum(TaskType, { each: true })
  types?: TaskType[];

  @Transform(({ value }) => parseQueryArray(value))
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  assigneeStaffMemberId?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  // Legacy alias
  @IsOptional()
  @IsString()
  search?: string;
}
