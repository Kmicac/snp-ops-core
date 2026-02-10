import { Type } from "class-transformer";
import { ArrayUnique, IsArray, IsOptional, IsString } from "class-validator";

export class UpdateEventResourcesDto {
  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  staffIds?: string[];

  @IsOptional()
  @Type(() => String)
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  assetIds?: string[];
}
