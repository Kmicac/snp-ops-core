import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateRefereeProfileDto {
  @IsString()
  staffMemberId!: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsBoolean()
  isHeadReferee?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
