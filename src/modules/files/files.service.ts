import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import type { UploadFolder } from "./domain/upload-folder";

export type UploadedFileInfo = {
  key: string;
  url: string;
};

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly publicReadObjects: boolean;

  constructor(private readonly config: ConfigService) {
    const filesCfg = this.config.get<{
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
      publicBaseUrl: string;
      publicReadObjects?: boolean;
    }>("files");

    if (!filesCfg) {
      throw new Error("files config not loaded");
    }

    this.bucket = filesCfg.bucket;
    this.publicBaseUrl = filesCfg.publicBaseUrl;
    this.publicReadObjects = filesCfg.publicReadObjects === true;

    this.s3 = new S3Client({
      region: filesCfg.region,
      credentials: {
        accessKeyId: filesCfg.accessKeyId,
        secretAccessKey: filesCfg.secretAccessKey,
      },
      endpoint: filesCfg.endpoint,
      forcePathStyle: !!filesCfg.endpoint,
    });
  }

  private sanitizePathPart(value: string): string {
    return value
      .split("/")
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && part !== "." && part !== "..")
      .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, ""))
      .filter(Boolean)
      .join("/");
  }

  private sanitizeExtension(originalName: string): string {
    const ext = originalName.split(".").pop()?.toLowerCase() ?? "";
    if (/^[a-z0-9]{1,10}$/.test(ext)) {
      return ext;
    }
    return "bin";
  }

  private buildKey(folder: string, originalName: string, entityId?: string): string {
    const cleanFolder = this.sanitizePathPart(folder);
    const cleanEntityId = entityId ? this.sanitizePathPart(entityId) : "";
    const ext = this.sanitizeExtension(originalName);
    const id = randomUUID();
    const basePath = cleanEntityId
      ? `${cleanFolder}/${cleanEntityId}`
      : cleanFolder;
    return `${basePath}/${id}.${ext}`;
  }

  private buildPublicUrl(key: string): string {
    const base = this.publicBaseUrl.replace(/\/+$/, "");
    return `${base}/${key}`;
  }

  async uploadPublicFile(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder: UploadFolder;
    entityId?: string;
  }): Promise<UploadedFileInfo> {
    const { buffer, mimeType, originalName, folder, entityId } = params;
    const key = this.buildKey(folder, originalName, entityId);

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ...(this.publicReadObjects ? { ACL: "public-read" as const } : {}),
        }),
      );

      const url = this.buildPublicUrl(key);
      this.logger.log(`Uploaded file to S3: ${key}`);
      return { key, url };
    } catch (error) {
      this.logger.error(
        `S3 upload failed for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException("File upload failed");
    }
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    this.logger.log(`Deleted file from S3: ${key}`);
  }
}
