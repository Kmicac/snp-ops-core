import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { PartnershipStatus } from "@prisma/client";

export class UpdatePartnershipDto {
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(PartnershipStatus)
  status?: PartnershipStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsString()
  scope?: string | null;

  @IsOptional()
  @IsString()
  benefits?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
