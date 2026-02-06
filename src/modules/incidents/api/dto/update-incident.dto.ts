import { IsDateString, IsEnum, IsOptional, IsString, Length } from "class-validator";
import { IncidentSeverity } from "@prisma/client";

export class UpdateIncidentDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @IsOptional()
  @IsDateString()
  occurredAt?: string | null;

  @IsOptional()
  @IsString()
  zoneId?: string | null;
}
