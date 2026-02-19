import { Module } from "@nestjs/common";
import { ImprovementsController } from "./api/improvements.controller";
import { ImprovementsService } from "./application/improvements.service";
import { ImprovementsRepository } from "./infrastructure/improvements.repo";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditRepo } from "../audit/infrastructure/audit.repo";
import { TasksModule } from "../tasks/tasks.module";

@Module({
  imports: [TasksModule],
  controllers: [ImprovementsController],
  providers: [ImprovementsService, ImprovementsRepository, PrismaService, AuditRepo],
})
export class ImprovementsModule {}
