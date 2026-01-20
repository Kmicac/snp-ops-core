import { Module } from "@nestjs/common";
import { IncidentsController } from "./api/incidents.controller";
import { IncidentsService } from "./application/incidents.service";
import { IncidentsRepository } from "./infrastructure/incidents.repo";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Module({
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsRepository, PrismaService],
})
export class IncidentsModule {}
