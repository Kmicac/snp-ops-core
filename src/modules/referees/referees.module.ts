import { Module } from "@nestjs/common";
import { RefereesController } from "./api/referees.controller";
import { RefereesService } from "./application/referees.service";
import { RefereesRepo } from "./infrastructure/referees.repo";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Module({
  controllers: [RefereesController],
  providers: [RefereesService, RefereesRepo, PrismaService],
  exports: [RefereesService],
})
export class RefereesModule {}
