import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class UpdateEventDto {
  // Se acepta solo por compatibilidad, pero no se persiste (code es inmutable).
  @IsOptional()
  @IsString()
  @Length(2, 80)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  venue?: string | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  imageKey?: string | null;

  // Campo legacy para compatibilidad.
  @IsOptional()
  @IsString()
  venueId?: string | null;
}
