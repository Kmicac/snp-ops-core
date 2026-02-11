import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { AssetCondition } from "@prisma/client";

export class CreateAssetDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  assetTag?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Puede guardar contenido QR (ej: "ASSET:{id}") o path/url/base64 para futuras integraciones S3/CDN.
  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  imageKey?: string;

  @IsOptional()
  @IsString()
  qrImageUrl?: string;

  @IsOptional()
  @IsString()
  qrImageKey?: string;

  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;
}
