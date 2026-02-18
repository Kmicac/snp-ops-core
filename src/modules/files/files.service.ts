import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
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
  private readonly allowDevInlineFallback: boolean;

  constructor(private readonly config: ConfigService) {
    const filesCfg = this.config.get<{
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
      publicBaseUrl: string;
    }>("files");

    if (!filesCfg) {
      throw new Error("files config not loaded");
    }

    this.bucket = filesCfg.bucket;
    this.publicBaseUrl = filesCfg.publicBaseUrl;
    const nodeEnv = this.config.get<string>("NODE_ENV") ?? "development";
    const fallbackFlag = this.config.get<string>("FILES_ALLOW_DEV_INLINE_FALLBACK");
    this.allowDevInlineFallback =
      nodeEnv !== "production" && fallbackFlag !== "false";

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

  private buildKey(folder: string, originalName: string, entityId?: string): string {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
    const cleanEntityId = entityId?.replace(/^\/+|\/+$/g, "");
    const ext = originalName.split(".").pop();
    const id = randomUUID();
    const basePath = cleanEntityId ? `${cleanFolder}/${cleanEntityId}` : cleanFolder;
    return `${basePath}/${id}.${ext ?? "bin"}`;
  }

  private buildPublicUrl(key: string): string {
    const base = this.publicBaseUrl.replace(/\/+$/g, "");
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
      const putInput: PutObjectCommandInput = {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      };

      await this.s3.send(
        new PutObjectCommand(putInput),
      );

      const url = this.buildPublicUrl(key);
      this.logger.log(`Uploaded file to S3: ${key}`);
      return { key, url };
    } catch (error) {
      if (this.allowDevInlineFallback) {
        this.logger.warn(
          `S3 upload unavailable, using non-production inline fallback for ${key}`,
        );
        return {
          key: `dev-inline/${key}`,
          url: `data:${mimeType};base64,${buffer.toString("base64")}`,
        };
      }

      this.logger.error(
        `S3 upload failed for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException("File storage service unavailable");
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
