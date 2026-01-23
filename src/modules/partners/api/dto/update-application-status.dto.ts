import { IsEnum, IsOptional, IsString } from "class-validator";
import { PartnerSponsorApplicationStatus } from "@prisma/client";

export class UpdateApplicationStatusDto {
  @IsEnum(PartnerSponsorApplicationStatus)
  status!: PartnerSponsorApplicationStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
