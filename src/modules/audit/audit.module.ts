import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditController } from "./api/audit.controller";
import { AuditService } from "./application/audit.service";
import { AuditRepo } from "./infrastructure/audit.repo";

@Module({
  controllers: [AuditController],
  providers: [PrismaService, AuditService, AuditRepo],
  exports: [AuditService],
})
export class AuditModule {}
