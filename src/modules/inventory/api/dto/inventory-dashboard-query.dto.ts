import { IsOptional, IsString } from "class-validator";

export class InventoryDashboardQueryDto {
  @IsOptional()
  @IsString()
  eventId?: string;
}
