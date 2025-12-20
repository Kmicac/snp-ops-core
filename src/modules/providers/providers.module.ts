import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ProvidersController } from "./api/providers.controller";
import { ProvidersService } from "./application/providers.service";
import { ProvidersRepo } from "./infrastructure/providers.repo";
import { RolesGuard } from "../auth/security/roles.guard";
import { Reflector } from "@nestjs/core";


@Module({
  controllers: [ProvidersController],
  providers: [PrismaService, ProvidersService, ProvidersRepo, Reflector, RolesGuard],
})
export class ProvidersModule { }
