import { Body, Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { FilesService } from "./files.service";
import { IsString } from "class-validator";
import { OrgRole } from "@prisma/client";
import { Roles } from "../auth/security/roles.decorator";

class UploadFileDto {
  @IsString()
  folder!: string; 
}

@Controller("files")
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, }))
  @Post("upload")
  async uploadFile(@Body() dto: UploadFileDto, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    return this.files.uploadPublicFile({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      folder: dto.folder,
    });
  }
}
