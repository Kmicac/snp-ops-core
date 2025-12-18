import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(2, 80)
  code!: string;

  @IsString()
  @Length(2, 160)
  name!: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  venueId?: string;
}
