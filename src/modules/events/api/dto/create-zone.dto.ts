import { IsOptional, IsString, Length } from 'class-validator';

export class CreateZoneDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;
}
