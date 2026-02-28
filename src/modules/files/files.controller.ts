import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { FilesService } from "./files.service";
import { IsOptional, IsString, Length, Matches } from "class-validator";
import { OrgRole } from "@prisma/client";
import { Roles } from "../auth/security/roles.decorator";
import { isAllowedUploadFolder } from "./domain/upload-folder";
import type { UploadFolder } from "./domain/upload-folder";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
]);

class UploadFileDto {
  @IsString()
  @Length(3, 200)
  @Matches(/^[a-zA-Z0-9_/-]+$/)
  folder!: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Matches(/^[a-zA-Z0-9_/-]+$/)
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
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          return cb(new BadRequestException("Unsupported file type"), false);
        }
        cb(null, true);
      },
    }),
  )
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
