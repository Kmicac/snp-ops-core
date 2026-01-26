import { Injectable } from "@nestjs/common";
import { AssetCondition, AssetStatus } from "@prisma/client";
import { InventoryRepo } from "../infrastructure/inventory.repo";

@Injectable()
export class InventoryService {
  constructor(private readonly repo: InventoryRepo) {}

  createCategory(organizationId: string, data: { name: string; description?: string }) {
    return this.repo.createCategory({
      organizationId,
      name: data.name,
      description: data.description,
    });
  }

  listCategories(organizationId: string) {
    return this.repo.listCategories(organizationId);
  }

  createAsset(organizationId: string, data: {
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
  }) {
    return this.repo.createAsset({
      organizationId,
      ...data,
    });
  }

  listAssets(organizationId: string, filters?: {
    categoryId?: string;
    status?: AssetStatus;
  }) {
    return this.repo.listAssets({
      organizationId,
      categoryId: filters?.categoryId,
      status: filters?.status,
    });
  }

  async updateAsset(organizationId: string, assetId: string, data: {
    name?: string;
    categoryId?: string;
    assetTag?: string;
    serialNumber?: string;
    description?: string;
    location?: string;
    quantity?: number;
    purchasePrice?: number;
    purchaseDate?: Date;
    status?: AssetStatus;
    condition?: AssetCondition;
  }) {
    // nos aseguramos de que pertenece a la org
    await this.repo.getAssetOrThrow(assetId, organizationId);
    return this.repo.updateAsset({
      assetId,
      organizationId,
      data,
    });
  }


  async checkoutAsset(params: {
    organizationId: string;
    assetId: string;
    eventId?: string;
    zoneId?: string;
    staffMemberId?: string;
    quantity?: number;
    expectedReturnAt?: Date;
    conditionOut?: AssetCondition;
    notes?: string;
  }) {
    // MVP: validar que el asset existe y pertenece a la org
    const asset = await this.repo.getAssetOrThrow(
      params.assetId,
      params.organizationId,
    );

    const usage = await this.repo.createUsage({
      assetId: asset.id,
      eventId: params.eventId,
      zoneId: params.zoneId,
      staffMemberId: params.staffMemberId,
      quantity: params.quantity,
      expectedReturnAt: params.expectedReturnAt,
      conditionOut: params.conditionOut ?? asset.condition,
      notes: params.notes,
    });

    await this.repo.updateAsset({
      assetId: asset.id,
      organizationId: params.organizationId,
      data: {
        status: AssetStatus.IN_USE,
      },
    });

    return usage;
  }

  async returnAsset(params: {
    organizationId: string;
    usageId: string;
    returnedAt?: Date;
    conditionIn?: AssetCondition;
    notes?: string;
  }) {
    const usage = await this.repo.getUsageOrThrow(params.usageId);

    const updatedUsage = await this.repo.markUsageReturned({
      usageId: usage.id,
      returnedAt: params.returnedAt,
      conditionIn: params.conditionIn,
      notes: params.notes,
    });

    const newStatus =
      params.conditionIn && params.conditionIn === AssetCondition.BROKEN
        ? AssetStatus.DAMAGED
        : AssetStatus.IN_STORAGE;

    await this.repo.updateAsset({
      assetId: usage.assetId,
      organizationId: params.organizationId,
      data: {
        status: newStatus,
        condition: params.conditionIn,
      },
    });

    return updatedUsage;
  }
}
