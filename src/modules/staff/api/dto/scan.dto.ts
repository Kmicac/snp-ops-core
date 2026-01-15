import { IsOptional, IsString } from "class-validator";

export class ScanDto {
  @IsString()
  qrToken!: string;

  @IsOptional() @IsString()
  zoneId?: string;
}
