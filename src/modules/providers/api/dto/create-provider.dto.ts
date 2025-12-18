import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class CreateProviderDto {
  @IsString() @Length(2, 120)
  name!: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  notes?: string;
}
