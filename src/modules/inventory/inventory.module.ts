import { Module } from "@nestjs/common";
import { InventoryController } from "./api/inventory.controller";
import { InventoryService } from "./application/inventory.service";
import { InventoryRepo } from "./infrastructure/inventory.repo";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRepo, PrismaService],
  exports: [InventoryService, InventoryRepo],
})
export class InventoryModule {}
