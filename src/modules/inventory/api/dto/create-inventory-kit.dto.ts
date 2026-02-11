import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateInventoryKitItemDto {
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

export class CreateInventoryKitDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  eventType!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryKitItemDto)
  items?: CreateInventoryKitItemDto[];
}
