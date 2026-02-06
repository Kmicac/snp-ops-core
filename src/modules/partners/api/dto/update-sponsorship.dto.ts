import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { SponsorshipTier } from "@prisma/client";

export class UpdateSponsorshipDto {
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(SponsorshipTier)
  tier?: SponsorshipTier;

  @IsOptional()
  @IsInt()
  @Min(0)
  cashValue?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  inKindValue?: number | null;

  @IsOptional()
  @IsString()
  benefits?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
