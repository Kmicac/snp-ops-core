import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TasksController } from "./api/tasks.controller";
import { TasksService } from "./application/tasks.service";
import { TasksRepository } from "./infrastructure/tasks.repo";
import { AuditModule } from "../audit/audit.module";
import { StaffModule } from "../staff/staff.module";

@Module({
  imports: [AuditModule, StaffModule],
  controllers: [TasksController],
  providers: [PrismaService, TasksService, TasksRepository],
  exports: [TasksService],
})
export class TasksModule {}
