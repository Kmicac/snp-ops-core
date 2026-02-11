import { InventoryChecklistItemCondition } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class VerifyChecklistItemDto {
  @IsString()
  assetId!: string;

  @IsBoolean()
  verified!: boolean;

  @IsInt()
  @Min(0)
  quantityVerified!: number;

  @IsString()
  verifiedBy!: string;

  @IsEnum(InventoryChecklistItemCondition)
  condition!: InventoryChecklistItemCondition;

  @IsOptional()
  @IsString()
  notes?: string;
}
