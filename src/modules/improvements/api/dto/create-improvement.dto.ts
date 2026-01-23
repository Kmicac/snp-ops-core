import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { ImprovementType } from "@prisma/client";

export class CreateImprovementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(ImprovementType)
  type!: ImprovementType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  incidentId?: string;
}
