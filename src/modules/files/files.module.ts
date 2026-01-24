import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";

@Module({
  imports: [ConfigModule],
  providers: [FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
