import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(2, 80)
  code!: string;

  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  venue?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;

  // Campo legacy para compatibilidad.
  @IsOptional()
  @IsString()
  venueId?: string;
}
