import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl, IsNotEmpty } from "class-validator";

export class CreatePartnerSponsorApplicationDto {
  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  contactName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @IsBoolean()
  wantsPartner!: boolean;

  @IsBoolean()
  wantsSponsor!: boolean;

  @IsOptional()
  @IsString()
  preferredEventId?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
