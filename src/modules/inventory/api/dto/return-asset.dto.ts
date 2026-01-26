import { IsDateString, IsOptional, IsString } from "class-validator";
import { AssetCondition } from "@prisma/client";

export class ReturnAssetDto {
  @IsOptional()
  @IsDateString()
  returnedAt?: string;

  @IsOptional()
  conditionIn?: AssetCondition;

  @IsOptional()
  @IsString()
  notes?: string;
}
