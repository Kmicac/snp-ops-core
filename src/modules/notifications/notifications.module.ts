import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { NotificationsService } from "./notifications.service";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [NotificationsService, PrismaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
