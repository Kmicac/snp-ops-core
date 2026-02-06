import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateRefereeProfileDto {
  @IsOptional()
  @IsString()
  level?: string | null;

  @IsOptional()
  @IsBoolean()
  isHeadReferee?: boolean;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
