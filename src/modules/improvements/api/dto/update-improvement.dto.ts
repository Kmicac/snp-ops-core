import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { ImprovementType } from "@prisma/client";

export class UpdateImprovementDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ImprovementType)
  type?: ImprovementType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number | null;

  @IsOptional()
  @IsString()
  eventId?: string | null;

  @IsOptional()
  @IsString()
  incidentId?: string | null;
}
