import { TaskStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  newStatus!: TaskStatus;

  // Reservado para ordenamiento futuro en board.
  @IsOptional()
  @IsString()
  overTaskId?: string;
}
