import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { AssetCondition } from "@prisma/client";

export class ReturnAssetDto {
  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @IsOptional()
  @IsEnum(AssetCondition)
  conditionIn?: AssetCondition;

  @IsOptional()
  @IsString()
  notes?: string;
}
