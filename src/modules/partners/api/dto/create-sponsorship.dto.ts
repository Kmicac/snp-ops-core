import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { SponsorshipTier } from "@prisma/client";

export class CreateSponsorshipDto {
  @IsString()
  brandId!: string;

  @IsEnum(SponsorshipTier)
  tier!: SponsorshipTier;

  @IsOptional()
  @IsInt()
  @Min(0)
  cashValue?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  inKindValue?: number;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
