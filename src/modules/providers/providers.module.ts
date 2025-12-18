import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ProvidersController } from "./api/providers.controller";
import { ProvidersService } from "./application/providers.service";
import { ProvidersRepo } from "./infrastructure/providers.repo";

@Module({
  controllers: [ProvidersController],
  providers: [PrismaService, ProvidersService, ProvidersRepo],
})
export class ProvidersModule {}
