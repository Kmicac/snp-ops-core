import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  AssetUsage,
} from "@prisma/client";

@Injectable()
export class InventoryRepo {
  constructor(private readonly prisma: PrismaService) {}

  // -------- Categorías --------

  createCategory(params: {
    organizationId: string;
    name: string;
    description?: string;
  }): Promise<AssetCategory> {
    const { organizationId, name, description } = params;
    return this.prisma.assetCategory.create({
      data: {
        organizationId,
        name,
        description,
      },
    });
  }

  listCategories(organizationId: string): Promise<AssetCategory[]> {
    return this.prisma.assetCategory.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  // -------- Assets --------

  createAsset(params: {
    organizationId: string;
    name: string;
    categoryId?: string;
    assetTag?: string;
    serialNumber?: string;
    description?: string;
    location?: string;
    quantity?: number;
    purchasePrice?: number;
    purchaseDate?: Date;
    condition?: AssetCondition;
  }): Promise<Asset> {
    const {
      organizationId,
      name,
      categoryId,
      assetTag,
      serialNumber,
      description,
      location,
      quantity,
      purchasePrice,
      purchaseDate,
      condition,
    } = params;

    return this.prisma.asset.create({
      data: {
        organizationId,
        name,
        categoryId,
        assetTag,
        serialNumber,
        description,
        location,
        quantity: quantity ?? 1,
        purchasePrice,
        purchaseDate,
        condition: condition ?? AssetCondition.GOOD,
        status: AssetStatus.IN_STORAGE,
      },
    });
  }

  listAssets(params: {
    organizationId: string;
    categoryId?: string;
    status?: AssetStatus;
  }): Promise<Asset[]> {
    const { organizationId, categoryId, status } = params;
    return this.prisma.asset.findMany({
      where: {
        organizationId,
        categoryId,
        status,
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    });
  }

  async getAssetOrThrow(assetId: string, organizationId: string): Promise<Asset> {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, organizationId },
    });
    if (!asset) {
      throw new NotFoundException("Asset not found");
    }
    return asset;
  }

  updateAsset(params: {
    assetId: string;
    organizationId: string;
    data: Partial<Asset>;
  }): Promise<Asset> {
    const { assetId, organizationId, data } = params;
    return this.prisma.asset.update({
      where: { id: assetId },
      data: {
        ...data,
        organizationId,
      },
    });
  }

  // -------- Uso de assets (checkout / return) --------

  async createUsage(params: {
    assetId: string;
    eventId?: string;
    zoneId?: string;
    staffMemberId?: string;
    quantity?: number;
    expectedReturnAt?: Date;
    conditionOut?: AssetCondition;
    notes?: string;
  }): Promise<AssetUsage> {
    const {
      assetId,
      eventId,
      zoneId,
      staffMemberId,
      quantity,
      expectedReturnAt,
      conditionOut,
      notes,
    } = params;

    return this.prisma.assetUsage.create({
      data: {
        assetId,
        eventId,
        zoneId,
        staffMemberId,
        quantity: quantity ?? 1,
        expectedReturnAt,
        conditionOut,
        notes,
      },
    });
  }

  async markUsageReturned(params: {
    usageId: string;
    returnedAt?: Date;
    conditionIn?: AssetCondition;
    notes?: string;
  }): Promise<AssetUsage> {
    const { usageId, returnedAt, conditionIn, notes } = params;

    return this.prisma.assetUsage.update({
      where: { id: usageId },
      data: {
        returnedAt: returnedAt ?? new Date(),
        conditionIn,
        notes,
      },
    });
  }

  async getUsageOrThrow(usageId: string): Promise<AssetUsage> {
    const usage = await this.prisma.assetUsage.findUnique({
      where: { id: usageId },
    });
    if (!usage) {
      throw new NotFoundException("Asset usage not found");
    }
    return usage;
  }
}
