import { Module } from "@nestjs/common";
import { IncidentsController } from "./api/incidents.controller";
import { IncidentsService } from "./application/incidents.service";
import { IncidentsRepository } from "./infrastructure/incidents.repo";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditRepo } from "../audit/infrastructure/audit.repo";

@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsRepository, PrismaService, AuditRepo],
})
export class IncidentsModule {}
