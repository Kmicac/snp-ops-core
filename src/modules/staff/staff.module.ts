import { Module } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { StaffController } from "./api/staff.controller";
import { StaffService } from "./application/staff.service";
import { StaffRepo } from "./infrastructure/staff.repo";

@Module({
  controllers: [StaffController],
  providers: [PrismaService, StaffService, StaffRepo],
})
export class StaffModule {}
