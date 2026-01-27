import { IsBoolean, IsOptional, IsString } from "class-validator";

export class MarkAttendanceDto {
  @IsBoolean()
  attended!: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
