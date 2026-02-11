import { Injectable } from "@nestjs/common";

@Injectable()
export class InventoryQrService {
  generateAssetQrContent(assetId: string): string {
    return `ASSET:${assetId}`;
  }

  resolveStoredQr(
    storedQrCode: string | null,
    assetId: string,
    qrImageUrl?: string | null,
  ): {
    qrContent: string;
    qrImage: string | null;
  } {
    const generated = this.generateAssetQrContent(assetId);
    const qrContent =
      storedQrCode && storedQrCode.startsWith("ASSET:")
        ? storedQrCode
        : generated;

    return {
      qrContent,
      qrImage: qrImageUrl ?? null,
    };
  }
}
