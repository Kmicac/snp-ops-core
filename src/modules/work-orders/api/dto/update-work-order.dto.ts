import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  zoneId?: string | null;

  @IsOptional()
  @IsString()
  providerServiceId?: string | null;

  @IsOptional()
  @IsDateString()
  scheduledStartAt?: string | null;

  @IsOptional()
  @IsDateString()
  scheduledEndAt?: string | null;
}
