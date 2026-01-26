import { IsOptional, IsString } from "class-validator";

export class CreateAssetCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
