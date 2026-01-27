import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateTatamiDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
