import { registerAs } from "@nestjs/config";

export const filesConfig = registerAs("files", () => ({
  bucket: process.env.S3_BUCKET_NAME!,
  region: process.env.S3_REGION!,
  accessKeyId: process.env.S3_ACCESS_KEY_ID!,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  endpoint: process.env.S3_ENDPOINT || undefined,
  publicBaseUrl: process.env.S3_PUBLIC_BASE_URL!,
}));