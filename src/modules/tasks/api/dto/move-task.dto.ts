import { TaskStatus } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class MoveTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsString()
  beforeTaskId?: string;

  @IsOptional()
  @IsString()
  afterTaskId?: string;

  // Campos legacy para compatibilidad hacia atrás.
  @IsOptional()
  @IsEnum(TaskStatus)
  newStatus?: TaskStatus;

  @IsOptional()
  @IsString()
  overTaskId?: string;
}
