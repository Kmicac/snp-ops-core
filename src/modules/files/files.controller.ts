import { Body, Controller, Post, UploadedFile, UseInterceptors, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { FilesService } from "./files.service";
import { IsOptional, IsString } from "class-validator";
import { OrgRole } from "@prisma/client";
import { Roles } from "../auth/security/roles.decorator";
import { isAllowedUploadFolder } from "./domain/upload-folder";
import type { UploadFolder } from "./domain/upload-folder";

class UploadFileDto {
  @IsString()
  folder!: string; 

  @IsOptional()
  @IsString()
  entityId?: string;
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

    if (!isAllowedUploadFolder(dto.folder)) {
      throw new BadRequestException(
        "Invalid folder. Allowed: partners, assets, assets-qr, inventory-qr, tasks, tasks-comments, orgs/*, events/*",
      );
    }

    return this.files.uploadPublicFile({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      folder: dto.folder as UploadFolder,
      entityId: dto.entityId,
    });
  }
}
