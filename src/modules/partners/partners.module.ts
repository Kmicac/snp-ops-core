import { Module } from "@nestjs/common";
import { PartnersController } from "./api/partners.controller";
import { PartnersService } from "./application/partners.service";
import { PartnersRepo } from "./infrastructure/partners.repo";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { FilesModule } from "../files/files.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [FilesModule, AuditModule],
  controllers: [PartnersController],
  providers: [PartnersService, PartnersRepo, PrismaService],
})
export class PartnersModule {}
