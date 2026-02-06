import { IsOptional, IsString } from "class-validator";

export class UpdateCredentialDto {
  @IsOptional()
  @IsString()
  notes?: string | null;
}
