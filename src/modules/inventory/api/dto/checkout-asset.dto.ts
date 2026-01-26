import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { AssetCondition } from "@prisma/client";

export class CheckoutAssetDto {
  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  staffMemberId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsDateString()
  expectedReturnAt?: string;

  @IsOptional()
  conditionOut?: AssetCondition;

  @IsOptional()
  @IsString()
  notes?: string;
}
