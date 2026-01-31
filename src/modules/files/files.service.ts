import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

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

    this.s3 = new S3Client({
      region: filesCfg.region,
      credentials: {
        accessKeyId: filesCfg.accessKeyId,
        secretAccessKey: filesCfg.secretAccessKey,
      },
      endpoint: filesCfg.endpoint,
      forcePathStyle: !!filesCfg.endpoint, // útil para MinIO/R2
    });
  }

  private buildKey(folder: string, originalName: string): string {
    const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
    const ext = originalName.split(".").pop();
    const id = randomUUID();
    return `${cleanFolder}/${id}.${ext ?? "bin"}`;
  }

  private buildPublicUrl(key: string): string {
    const base = this.publicBaseUrl.replace(/\/+$/, "");
    return `${base}/${key}`;
  }

  async uploadPublicFile(params: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
    folder: string; // ej: "partners", "events/ADCC_LATAM_2025/sponsors"
  }): Promise<UploadedFileInfo> {
    const { buffer, mimeType, originalName, folder } = params;
    const key = this.buildKey(folder, originalName);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: "public-read", // si usas ACLs públicas
      }),
    );

    const url = this.buildPublicUrl(key);
    this.logger.log(`Uploaded file to S3: ${key}`);
    return { key, url };
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
