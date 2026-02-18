import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { OrgRole } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";
import { extname } from "path";

import { FilesService } from "./files.service";
import { Roles } from "../auth/security/roles.decorator";
import { isAllowedUploadFolder } from "./domain/upload-folder";
import type { UploadFolder } from "./domain/upload-folder";
import { PrismaService } from "src/shared/prisma/prisma.service";

const UPLOAD_ROLES: OrgRole[] = [
  OrgRole.SUPER_ADMIN,
  OrgRole.EVENT_DIRECTOR,
  OrgRole.TECH_SYSTEMS,
  OrgRole.GUADA,
];

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const ALLOWED_EXTENSIONS_BY_MIME: Readonly<Record<string, readonly string[]>> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};

class UploadFileDto {
  @IsString()
  folder!: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsString()
  orgId?: string;
}

@Controller()
export class FilesController {
  constructor(
    private readonly files: FilesService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertMembership(orgId: string, userId?: string) {
    if (!userId) {
      throw new ForbiddenException("Missing user");
    }

    const membership = await this.prisma.orgMembership.findFirst({
      where: {
        organizationId: orgId,
        userId,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException("You do not belong to this organization");
    }
  }

  private async resolveScopedFolder(folder: string, orgId: string): Promise<UploadFolder> {
    if (!isAllowedUploadFolder(folder)) {
      throw new BadRequestException(
        "Invalid folder. Allowed: partners, assets, assets-qr, inventory-qr, tasks, tasks-comments, orgs/*, events/*",
      );
    }

    const normalized = folder.trim().replace(/^\/+|\/+$/g, "");

    if (normalized.startsWith("orgs/")) {
      const orgPrefix = `orgs/${orgId}`;
      if (normalized !== orgPrefix && !normalized.startsWith(`${orgPrefix}/`)) {
        throw new BadRequestException("Folder org does not match path orgId");
      }
      return normalized as UploadFolder;
    }

    if (normalized.startsWith("events/")) {
      const [, eventId, ...rest] = normalized.split("/");
      if (!eventId) {
        throw new BadRequestException("events/* folder must include an eventId");
      }

      const event = await this.prisma.event.findFirst({
        where: {
          id: eventId,
          organizationId: orgId,
        },
        select: { id: true },
      });

      if (!event) {
        throw new NotFoundException("Event not found in organization");
      }

      const suffix = rest.length > 0 ? `/${rest.join("/")}` : "";
      return `orgs/${orgId}/events/${eventId}${suffix}` as UploadFolder;
    }

    // Legacy static folders are auto-scoped under org to enforce tenancy.
    return `orgs/${orgId}/${normalized}` as UploadFolder;
  }

  private validateMimeType(file: Express.Multer.File) {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        "Unsupported mime type. Allowed: image/jpeg, image/png, image/webp, application/pdf",
      );
    }

    const originalExtension = extname(file.originalname ?? "").toLowerCase();
    const allowedExtensions = ALLOWED_EXTENSIONS_BY_MIME[file.mimetype];

    if (!allowedExtensions?.includes(originalExtension)) {
      throw new BadRequestException(
        `Unsupported file extension for ${file.mimetype}. Allowed: ${allowedExtensions?.join(", ") ?? "none"}`,
      );
    }
  }

  private async uploadWithOrg(
    orgId: string,
    dto: UploadFileDto,
    file: Express.Multer.File,
    req: any,
  ) {
    if (!file) {
      throw new BadRequestException("file is required");
    }

    this.validateMimeType(file);
    await this.assertMembership(orgId, req.user?.sub);
    const scopedFolder = await this.resolveScopedFolder(dto.folder, orgId);

    return this.files.uploadPublicFile({
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
      folder: scopedFolder,
      entityId: dto.entityId,
    });
  }

  @Roles(...UPLOAD_ROLES)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Post("/orgs/:orgId/files/upload")
  async uploadFile(
    @Param("orgId") orgId: string,
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.uploadWithOrg(orgId, dto, file, req);
  }

  // Legacy endpoint: kept for compatibility while enforcing org tenancy.
  @Roles(...UPLOAD_ROLES)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @Post("/files/upload")
  async uploadFileLegacy(
    @Body() dto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!dto.orgId?.trim()) {
      throw new BadRequestException("orgId is required for legacy upload route");
    }

    return this.uploadWithOrg(dto.orgId.trim(), dto, file, req);
  }
}
