import { SponsorshipStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateSponsorshipStatusDto {
  @IsEnum(SponsorshipStatus)
  status!: SponsorshipStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
