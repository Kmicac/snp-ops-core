import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  fullName?: string;

  @IsOptional()
  @IsString()
  documentId?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
