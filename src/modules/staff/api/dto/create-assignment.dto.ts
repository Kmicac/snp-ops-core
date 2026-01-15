import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { StaffRole } from "@prisma/client";

export class CreateAssignmentDto {
  @IsEnum(StaffRole)
  role!: StaffRole;

  @IsOptional() @IsString()
  zoneId?: string;

  @IsOptional() @IsString()
  shiftId?: string;

  @IsOptional() @IsDateString()
  startsAt?: string;

  @IsOptional() @IsDateString()
  endsAt?: string;
}
