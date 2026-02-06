import { IsEmail, IsOptional, IsString, Length } from "class-validator";

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  websiteUrl?: string | null;

  @IsOptional()
  @IsString()
  instagramUrl?: string | null;

  @IsOptional()
  @IsString()
  contactName?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
