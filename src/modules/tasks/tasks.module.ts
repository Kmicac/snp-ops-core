import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TasksController } from "./api/tasks.controller";
import { TasksService } from "./application/tasks.service";
import { TasksRepository } from "./infrastructure/tasks.repo";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [TasksController],
  providers: [PrismaService, TasksService, TasksRepository],
})
export class TasksModule {}
