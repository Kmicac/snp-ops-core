import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  IsNotEmpty,
  Length,
  Matches,
} from "class-validator";

export class CreatePartnerSponsorApplicationDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  companyName!: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 160)
  contactName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @Length(7, 30)
  @Matches(/^[0-9+\-\s()]+$/)
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
  @Length(1, 64)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  preferredEventId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  message?: string;
}
