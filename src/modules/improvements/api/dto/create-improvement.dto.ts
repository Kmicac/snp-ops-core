import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Length,
  Matches,
} from "class-validator";
import { ImprovementType } from "@prisma/client";

export class CreateImprovementDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 4000)
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
  @Length(1, 64)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  eventId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  incidentId?: string;
}
