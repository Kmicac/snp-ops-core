import { IsOptional, IsString, Length } from "class-validator";

export class UpdateAssetCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
