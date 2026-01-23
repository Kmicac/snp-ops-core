import { IsOptional, IsString, IsUrl } from "class-validator";

export class CreatePartnershipDto {
  @IsString()
  brandId!: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
