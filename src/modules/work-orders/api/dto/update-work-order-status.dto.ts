import { IsEnum, IsOptional, IsString } from "class-validator";
import { WorkOrderStatus } from "@prisma/client";

export class UpdateWorkOrderStatusDto {
  @IsEnum(WorkOrderStatus)
  status!: WorkOrderStatus;

  @IsOptional() @IsString()
  note?: string; // se guarda como evidence "note" para trazabilidad
}
