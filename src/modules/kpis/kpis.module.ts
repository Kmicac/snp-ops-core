import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { KpisController } from "./api/kpis.controller";
import { KpisService } from "./application/kpis.service";
import { KpisRepo } from "./infrastructure/kpis.repo";

@Module({
  controllers: [KpisController],
  providers: [PrismaService, KpisService, KpisRepo],
})
export class KpisModule {}
