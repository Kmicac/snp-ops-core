import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString() @Length(8, 72)
  password!: string;

  @IsOptional() @IsString() @Length(2, 120)
  fullName?: string;
}
