import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppEnv } from "src/config/env";

@Injectable()
export class FilesService {
  private s3: S3Client | null = null;
  private bucket: string | null = null;

  constructor(private readonly config: ConfigService<AppEnv, true>) {
    const region = this.config.get("AWS_REGION");
    const bucket = this.config.get("S3_BUCKET_PARTNER_ASSETS");
    const accessKeyId = this.config.get("AWS_ACCESS_KEY_ID");
    const secretAccessKey = this.config.get("AWS_SECRET_ACCESS_KEY");

    if (region && bucket && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.bucket = bucket;
    }
  }

  async getSignedUploadUrl(params: {
    keyPrefix: string;      // ej: "brands", "sponsors", "partners"
    fileName: string;       // ej: "logo.png"
    contentType: string;    // ej: "image/png"
    expiresInSeconds?: number;
  }) {
    if (!this.s3 || !this.bucket) {
      throw new InternalServerErrorException(
        "S3 is not configured on this environment",
      );
    }

    const key = `${params.keyPrefix}/${Date.now()}-${params.fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
      ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: params.expiresInSeconds ?? 600, // 10 min
    });

    const fileUrl = `https://${this.bucket}.s3.${this.config.get("AWS_REGION")}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl };
  }
}
