import { Body, Controller, Post } from "@nestjs/common";
import { FilesService } from "./files.service";
import { IsString } from "class-validator";
import { OrgRole } from "@prisma/client";
import { Roles } from "../auth/security/roles.decorator";

class GetUploadUrlDto {
  @IsString()
  folder!: string; // "brands" | "partners" | "sponsors"

  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string; // "image/png", etc.
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
  @Post("upload-url")
  getUploadUrl(@Body() dto: GetUploadUrlDto) {
    return this.files.getSignedUploadUrl({
      keyPrefix: dto.folder,
      fileName: dto.fileName,
      contentType: dto.contentType,
    });
  }
}
