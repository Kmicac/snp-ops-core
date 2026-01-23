import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class AddIncidentEvidenceDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
