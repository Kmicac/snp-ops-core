import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class CreateStaffDto {
  @IsString() @Length(2, 120)
  fullName!: string;

  @IsOptional() @IsString()
  documentId?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  notes?: string;
}
