import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
  Length,
  Matches,
} from "class-validator";
import { IncidentSeverity } from "@prisma/client";

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 4000)
  description!: string;

  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  zoneId?: string;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
