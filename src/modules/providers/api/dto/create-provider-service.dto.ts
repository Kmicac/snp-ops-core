import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from "class-validator";
import { ServiceCategory } from "@prisma/client";

export class CreateProviderServiceDto {
  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @IsString() @Length(2, 120)
  name!: string;

  @IsOptional() @IsInt() @Min(1)
  slaMinutes?: number;

  @IsOptional() @IsInt() @Min(0)
  windowSlackMinutes?: number;

  @IsOptional() @IsString()
  notes?: string;
}
