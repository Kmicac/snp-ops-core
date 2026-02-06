import { IsDateString, IsOptional, IsString, Length } from "class-validator";

export class UpdateShiftDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
