import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PrismaService } from "src/shared/prisma/prisma.service";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
