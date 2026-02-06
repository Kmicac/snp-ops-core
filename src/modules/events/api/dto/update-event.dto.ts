import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @Length(2, 80)
  code?: string;

  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  venueId?: string | null;
}
