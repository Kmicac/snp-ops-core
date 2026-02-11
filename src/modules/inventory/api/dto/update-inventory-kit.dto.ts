import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class UpdateInventoryKitItemDto {
  @IsOptional()
  @IsString()
  assetId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class UpdateInventoryKitDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateInventoryKitItemDto)
  items?: UpdateInventoryKitItemDto[];
}
