import { Module } from "@nestjs/common";
import { InventoryController } from "./api/inventory.controller";
import { InventoryService } from "./application/inventory.service";
import { InventoryRepo } from "./infrastructure/inventory.repo";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { AuditModule } from "../audit/audit.module";
import { InventoryQrService } from "./application/inventory-qr.service";
import { InventoryReportsService } from "./application/inventory-reports.service";

@Module({
  imports: [AuditModule],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryReportsService,
    InventoryQrService,
    InventoryRepo,
    PrismaService,
  ],
  exports: [InventoryService, InventoryRepo],
})
export class InventoryModule {}
