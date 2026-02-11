import { InventoryChecklistType } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateInventoryChecklistDto {
  @IsString()
  eventId!: string;

  @IsEnum(InventoryChecklistType)
  checklistType!: InventoryChecklistType;

  @IsOptional()
  @IsString()
  responsibleName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
