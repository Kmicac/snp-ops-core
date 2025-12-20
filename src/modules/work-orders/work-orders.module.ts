import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { WorkOrdersController } from "./api/work-orders.controller";
import { WorkOrdersService } from "./application/work-orders.service";
import { WorkOrdersRepo } from "./infrastructure/work-orders.repo";

@Module({
  controllers: [WorkOrdersController],
  providers: [PrismaService, WorkOrdersService, WorkOrdersRepo],
})
export class WorkOrdersModule {}
