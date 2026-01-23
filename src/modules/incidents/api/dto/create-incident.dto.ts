import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
} from "class-validator";
import { IncidentSeverity } from "@prisma/client";

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
