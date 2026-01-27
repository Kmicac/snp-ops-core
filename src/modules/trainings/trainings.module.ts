import { Module } from "@nestjs/common";
import { TrainingsController } from "./api/trainings.controller";
import { TrainingsService } from "./application/trainings.service";
import { TrainingsRepo } from "./infrastructure/trainings.repo";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Module({
  controllers: [TrainingsController],
  providers: [TrainingsService, TrainingsRepo, PrismaService],
  exports: [TrainingsService],
})
export class TrainingsModule {}
