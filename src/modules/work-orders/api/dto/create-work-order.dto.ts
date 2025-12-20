import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class CreateWorkOrderDto {
  @IsString() @Length(2, 140)
  title!: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  zoneId?: string;

  @IsOptional() @IsDateString()
  scheduledStartAt?: string;

  @IsOptional() @IsDateString()
  scheduledEndAt?: string;
}
