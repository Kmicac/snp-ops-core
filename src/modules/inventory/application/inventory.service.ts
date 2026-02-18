import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AssetCondition,
  AssetStatus,
  AuditActionType,
  AuditEntityType,
  InventoryChecklistItemCondition,
  InventoryChecklistStatus,
  InventoryChecklistType,
  InventoryMovementType,
  Prisma,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { AuditService } from "src/modules/audit/application/audit.service";
import { InventoryRepo } from "../infrastructure/inventory.repo";
import { InventoryQrService } from "./inventory-qr.service";

@Injectable()
export class InventoryService {
  constructor(
    private readonly repo: InventoryRepo,
    private readonly audit: AuditService,
    private readonly qr: InventoryQrService,
  ) {}

  private normalizeLimit(limit?: number): number {
    if (!limit) return 50;
    return Math.max(1, Math.min(200, limit));
  }

  private normalizeOffset(offset?: number): number {
    return Math.max(0, offset ?? 0);
  }

  private mapPerformerMap(users: Array<{ id: string; fullName: string | null; email: string }>) {
    return new Map(users.map((user) => [user.id, user.fullName ?? user.email]));
  }

  private normalizeText(value?: string | null): string | undefined {
    if (value === undefined) return undefined;
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private normalizeNullableText(value?: string | null): string | null | undefined {
    if (value === undefined) return undefined;
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private ensureQuantityAtLeastOne(quantity: number | undefined, label: string): number | undefined {
    if (quantity === undefined) return undefined;
    if (quantity < 1) {
      throw new BadRequestException(`${label} must be >= 1`);
    }
    return quantity;
  }

  private normalizeKitItems(
    items: Array<{
      assetId?: string | null;
      categoryId?: string | null;
      name: string;
      quantity: number;
    }>,
  ) {
    return items.map((item) => {
      const name = item.name.trim();
      if (!name) {
        throw new BadRequestException("Kit item name is required");
      }

      if (!item.assetId && !item.categoryId) {
        throw new BadRequestException(
          "Kit item requires assetId or categoryId",
        );
      }

      if (item.quantity < 1) {
        throw new BadRequestException("Kit item quantity must be >= 1");
      }

      return {
        assetId: item.assetId?.trim() ?? null,
        categoryId: item.categoryId?.trim() ?? null,
        name,
        quantity: item.quantity,
      };
    });
  }

  private async generateChecklistNumber(organizationId: string): Promise<string> {
    for (let i = 0; i < 5; i += 1) {
      const now = new Date();
      const dateStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const suffix = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
      const checklistNumber = `CHK-${dateStamp}-${suffix}`;

      const exists = await this.repo.existsChecklistNumber(
        organizationId,
        checklistNumber,
      );
      if (!exists) {
        return checklistNumber;
      }
    }

    throw new ConflictException("Unable to generate unique checklist number");
  }

  createCategory(organizationId: string, data: { name: string; description?: string }) {
    return this.repo.createCategory({
      organizationId,
      name: data.name.trim(),
      description: data.description?.trim(),
    });
  }

  listCategories(organizationId: string) {
    return this.repo.listCategories(organizationId);
  }

  async updateCategory(
    organizationId: string,
    categoryId: string,
    data: {
      name?: string;
      description?: string | null;
    },
  ) {
    const current = await this.repo.getCategoryOrThrow(categoryId, organizationId);

    const patch: Prisma.AssetCategoryUpdateInput = {};
    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.description !== undefined) patch.description = data.description?.trim() ?? null;

    return this.repo.updateCategory({
      categoryId: current.id,
      data: patch,
    });
  }

  async createAsset(
    organizationId: string,
    data: {
      name: string;
      categoryId?: string;
      assetTag?: string;
      serialNumber?: string;
      description?: string;
      location?: string;
      quantity?: number;
      purchasePrice?: number;
      purchaseDate?: Date;
      supplierName?: string;
      notes?: string;
      qrCode?: string;
      imageUrl?: string;
      imageKey?: string;
      qrImageUrl?: string;
      qrImageKey?: string;
      condition?: AssetCondition;
    },
    actor?: {
      userId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    if (data.categoryId) {
      await this.repo.getCategoryOrThrow(data.categoryId, organizationId);
    }

    const created = await this.repo.createAsset({
      organizationId,
      name: data.name.trim(),
      categoryId: data.categoryId,
      assetTag: this.normalizeText(data.assetTag),
      serialNumber: this.normalizeText(data.serialNumber),
      description: this.normalizeNullableText(data.description) ?? undefined,
      location: this.normalizeText(data.location),
      quantity: this.ensureQuantityAtLeastOne(data.quantity, "quantity"),
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate,
      supplierName: this.normalizeNullableText(data.supplierName) ?? undefined,
      notes: this.normalizeNullableText(data.notes) ?? undefined,
      qrCode: this.normalizeNullableText(data.qrCode) ?? undefined,
      imageUrl: this.normalizeNullableText(data.imageUrl) ?? undefined,
      imageKey: this.normalizeNullableText(data.imageKey) ?? undefined,
      qrImageUrl: this.normalizeNullableText(data.qrImageUrl) ?? undefined,
      qrImageKey: this.normalizeNullableText(data.qrImageKey) ?? undefined,
      condition: data.condition,
    });

    const qrContent = created.qrCode ?? this.qr.generateAssetQrContent(created.id);
    const finalAsset =
      created.qrCode
        ? created
        : await this.repo.updateAsset({
            assetId: created.id,
            organizationId,
            data: { qrCode: qrContent },
          });

    await this.audit.log({
      organizationId,
      userId: actor?.userId ?? null,
      entityType: AuditEntityType.INVENTORY_ASSET,
      entityId: finalAsset.id,
      action: AuditActionType.CREATED,
      message: `INVENTORY_ASSET_CREATED: ${finalAsset.name}`,
      changes: {
        status: finalAsset.status,
        condition: finalAsset.condition,
      },
      ip: actor?.ip ?? null,
      userAgent: actor?.userAgent ?? null,
    });

    return finalAsset;
  }

  listAssets(
    organizationId: string,
    filters?: {
      categoryId?: string;
      status?: AssetStatus;
    },
  ) {
    return this.repo.listAssets({
      organizationId,
      categoryId: filters?.categoryId,
      status: filters?.status,
    });
  }

  async updateAsset(
    organizationId: string,
    assetId: string,
    data: {
      name?: string;
      categoryId?: string;
      assetTag?: string;
      serialNumber?: string;
      description?: string;
      location?: string;
      quantity?: number;
      purchasePrice?: number;
      purchaseDate?: Date;
      supplierName?: string;
      notes?: string;
      qrCode?: string;
      imageUrl?: string;
      imageKey?: string;
      qrImageUrl?: string;
      qrImageKey?: string;
      status?: AssetStatus;
      condition?: AssetCondition;
    },
    actor?: {
      userId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const current = await this.repo.getAssetOrThrow(assetId, organizationId);

    const patch: Prisma.AssetUpdateInput = {};

    if (data.name !== undefined) patch.name = data.name.trim();
    if (data.categoryId !== undefined) {
      const categoryId = data.categoryId.trim();
      if (!categoryId) {
        patch.category = { disconnect: true };
      } else {
        await this.repo.getCategoryOrThrow(categoryId, organizationId);
        patch.category = { connect: { id: categoryId } };
      }
    }
    if (data.assetTag !== undefined) patch.assetTag = this.normalizeNullableText(data.assetTag);
    if (data.serialNumber !== undefined) {
      patch.serialNumber = this.normalizeNullableText(data.serialNumber);
    }
    if (data.description !== undefined) {
      patch.description = this.normalizeNullableText(data.description);
    }
    if (data.location !== undefined) {
      patch.location = this.normalizeText(data.location) ?? "Main warehouse";
    }
    if (data.quantity !== undefined) {
      patch.quantity = this.ensureQuantityAtLeastOne(data.quantity, "quantity");
    }
    if (data.purchasePrice !== undefined) patch.purchasePrice = data.purchasePrice;
    if (data.purchaseDate !== undefined) patch.purchaseDate = data.purchaseDate;
    if (data.supplierName !== undefined) {
      patch.supplierName = this.normalizeNullableText(data.supplierName);
    }
    if (data.notes !== undefined) patch.notes = this.normalizeNullableText(data.notes);
    if (data.qrCode !== undefined) patch.qrCode = this.normalizeNullableText(data.qrCode);
    if (data.imageUrl !== undefined) patch.imageUrl = this.normalizeNullableText(data.imageUrl);
    if (data.imageKey !== undefined) patch.imageKey = this.normalizeNullableText(data.imageKey);
    if (data.qrImageUrl !== undefined) {
      patch.qrImageUrl = this.normalizeNullableText(data.qrImageUrl);
    }
    if (data.qrImageKey !== undefined) {
      patch.qrImageKey = this.normalizeNullableText(data.qrImageKey);
    }
    // TODO: si se define cleanup centralizado en FilesService, borrar imageKey/qrImageKey previos al reemplazar.
    if (data.status !== undefined) patch.status = data.status;
    if (data.condition !== undefined) patch.condition = data.condition;

    const updated = await this.repo.updateAsset({
      assetId,
      organizationId,
      data: patch,
    });

    await this.audit.log({
      organizationId,
      userId: actor?.userId ?? null,
      entityType: AuditEntityType.INVENTORY_ASSET,
      entityId: updated.id,
      action: AuditActionType.UPDATED,
      message: `INVENTORY_ASSET_UPDATED: ${updated.name}`,
      changes: {
        before: {
          name: current.name,
          status: current.status,
          condition: current.condition,
          location: current.location,
          notes: current.notes,
          imageUrl: current.imageUrl,
          imageKey: current.imageKey,
          qrImageUrl: current.qrImageUrl,
          qrImageKey: current.qrImageKey,
        },
        after: {
          name: updated.name,
          status: updated.status,
          condition: updated.condition,
          location: updated.location,
          notes: updated.notes,
          imageUrl: updated.imageUrl,
          imageKey: updated.imageKey,
          qrImageUrl: updated.qrImageUrl,
          qrImageKey: updated.qrImageKey,
        },
      },
      ip: actor?.ip ?? null,
      userAgent: actor?.userAgent ?? null,
    });

    return updated;
  }

  async deleteAsset(
    organizationId: string,
    assetId: string,
    actor?: {
      userId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const current = await this.repo.getAssetOrThrow(assetId, organizationId);

    const activeUsages = await this.repo.countActiveCheckoutsForAsset({
      organizationId,
      assetId,
    });

    if (activeUsages > 0) {
      throw new ConflictException(
        "Asset has active usage and cannot be deleted until it is returned",
      );
    }

    const [kitRefs, checklistRefs, eventResourceRefs, anyUsages] = await Promise.all([
      this.repo.countKitItemsForAsset({ organizationId, assetId }),
      this.repo.countChecklistItemsForAsset({ organizationId, assetId }),
      this.repo.countEventResourcesForAsset({ organizationId, assetId }),
      this.repo.countAnyUsagesForAsset({ organizationId, assetId }),
    ]);

    if (kitRefs > 0 || checklistRefs > 0) {
      throw new ConflictException(
        "Asset is referenced by inventory kit/checklist items and cannot be deleted",
      );
    }

    // No soft-delete column exists in schema, so historical references block hard delete.
    if (eventResourceRefs > 0 || anyUsages > 0) {
      throw new ConflictException(
        "Asset has historical references and cannot be deleted",
      );
    }

    await this.repo.deleteAsset({ organizationId, assetId });

    await this.audit.log({
      organizationId,
      userId: actor?.userId ?? null,
      entityType: AuditEntityType.INVENTORY_ASSET,
      entityId: current.id,
      action: AuditActionType.DELETED,
      message: `INVENTORY_ASSET_DELETED: ${current.name}`,
      changes: {
        assetTag: current.assetTag,
        status: current.status,
        condition: current.condition,
      },
      ip: actor?.ip ?? null,
      userAgent: actor?.userAgent ?? null,
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
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (!params.eventId) {
      throw new BadRequestException("eventId is required for checkout");
    }

    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    if (params.zoneId) {
      await this.repo.assertZoneInEvent(params.zoneId, params.eventId);
    }

    if (params.staffMemberId) {
      await this.repo.assertStaffMemberInOrg(
        params.staffMemberId,
        params.organizationId,
      );
    }

    this.ensureQuantityAtLeastOne(params.quantity, "checkout quantity");

    const usage = await this.repo.createCheckoutWithAssetUpdate(params);

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.INVENTORY_MOVEMENT,
      entityId: usage.id,
      action: AuditActionType.CREATED,
      message: "INVENTORY_ASSET_CHECKOUT",
      changes: {
        movementType: InventoryMovementType.CHECK_OUT,
        assetId: usage.assetId,
        quantity: usage.quantity,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return usage;
  }

  async returnAsset(params: {
    organizationId: string;
    usageId: string;
    eventId?: string;
    returnedAt?: Date;
    conditionIn?: AssetCondition;
    notes?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    const updatedUsage = await this.repo.returnUsageWithAssetUpdate({
      ...params,
      expectedEventId: params.eventId,
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: updatedUsage.eventId ?? null,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.INVENTORY_MOVEMENT,
      entityId: updatedUsage.id,
      action: AuditActionType.STATUS_CHANGED,
      message: "INVENTORY_ASSET_CHECKIN",
      changes: {
        usageId: updatedUsage.id,
        assetId: updatedUsage.assetId,
        returnedAt: updatedUsage.returnedAt,
        conditionIn: updatedUsage.conditionIn,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return updatedUsage;
  }

  async listMovements(params: {
    organizationId: string;
    assetId?: string;
    eventId?: string;
    movementType?: InventoryMovementType;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    if (params.eventId) {
      await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    }
    if (params.from && params.to && params.from > params.to) {
      throw new BadRequestException("from must be before or equal to to");
    }

    const limit = this.normalizeLimit(params.limit);
    const offset = this.normalizeOffset(params.offset);

    const { data, total } = await this.repo.listMovements({
      organizationId: params.organizationId,
      assetId: params.assetId,
      eventId: params.eventId,
      movementType: params.movementType,
      from: params.from,
      to: params.to,
      limit,
      offset,
    });

    const users = await this.repo.listUsersByIds(
      [...new Set(data.map((row) => row.performedByUserId).filter(Boolean))] as string[],
    );
    const performers = this.mapPerformerMap(users);

    return {
      data: data.map((row) => ({
        id: row.id,
        timestamp: row.checkoutAt,
        movementType: row.movementType,
        assetId: row.assetId,
        assetName: row.assetName,
        eventId: row.eventId,
        eventName: row.eventName ?? row.event?.name ?? null,
        quantity: row.quantity,
        performedByUserId: row.performedByUserId,
        performedBy: row.performedByUserId
          ? (performers.get(row.performedByUserId) ?? row.performedByUserId)
          : null,
        notes: row.notes,
      })),
      total,
      limit,
      offset,
    };
  }

  async listKits(organizationId: string) {
    return this.repo.listKits(organizationId);
  }

  async getKit(organizationId: string, kitId: string) {
    return this.repo.getKitOrThrow(kitId, organizationId);
  }

  async createKit(
    organizationId: string,
    params: {
      name: string;
      description?: string;
      eventType: string;
      items?: Array<{
        assetId?: string;
        categoryId?: string;
        name: string;
        quantity: number;
      }>;
    },
    actor?: {
      userId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const items = this.normalizeKitItems(params.items ?? []);

    await this.repo.assertAssetsInOrg(
      [...new Set(items.map((item) => item.assetId).filter(Boolean))] as string[],
      organizationId,
    );

    await this.repo.assertCategoriesInOrg(
      [...new Set(items.map((item) => item.categoryId).filter(Boolean))] as string[],
      organizationId,
    );

    const kit = await this.repo.createKit({
      organizationId,
      name: params.name.trim(),
      description: this.normalizeNullableText(params.description),
      eventType: params.eventType.trim(),
      items,
    });

    await this.audit.log({
      organizationId,
      userId: actor?.userId ?? null,
      entityType: AuditEntityType.INVENTORY_KIT,
      entityId: kit.id,
      action: AuditActionType.CREATED,
      message: "INVENTORY_KIT_CREATED",
      changes: {
        name: kit.name,
        eventType: kit.eventType,
        itemsCount: items.length,
      },
      ip: actor?.ip ?? null,
      userAgent: actor?.userAgent ?? null,
    });

    return this.repo.getKitOrThrow(kit.id, organizationId);
  }

  async updateKit(
    organizationId: string,
    kitId: string,
    params: {
      name?: string;
      description?: string;
      eventType?: string;
      items?: Array<{
        assetId?: string;
        categoryId?: string;
        name: string;
        quantity: number;
      }>;
    },
    actor?: {
      userId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const current = await this.repo.getKitOrThrow(kitId, organizationId);

    const patch: Prisma.InventoryKitUpdateInput = {};
    if (params.name !== undefined) patch.name = params.name.trim();
    if (params.description !== undefined) {
      patch.description = this.normalizeNullableText(params.description);
    }
    if (params.eventType !== undefined) patch.eventType = params.eventType.trim();

    const normalizedItems = params.items
      ? this.normalizeKitItems(params.items)
      : undefined;

    if (normalizedItems) {
      await this.repo.assertAssetsInOrg(
        [...new Set(normalizedItems.map((item) => item.assetId).filter(Boolean))] as string[],
        organizationId,
      );

      await this.repo.assertCategoriesInOrg(
        [
          ...new Set(
            normalizedItems.map((item) => item.categoryId).filter(Boolean),
          ),
        ] as string[],
        organizationId,
      );
    }

    const updated = await this.repo.updateKit({
      organizationId,
      kitId,
      data: patch,
      items: normalizedItems,
    });

    await this.audit.log({
      organizationId,
      userId: actor?.userId ?? null,
      entityType: AuditEntityType.INVENTORY_KIT,
      entityId: updated.id,
      action: AuditActionType.UPDATED,
      message: "INVENTORY_KIT_UPDATED",
      changes: {
        before: {
          name: current.name,
          description: current.description,
          eventType: current.eventType,
        },
        after: {
          name: updated.name,
          description: updated.description,
          eventType: updated.eventType,
        },
      },
      ip: actor?.ip ?? null,
      userAgent: actor?.userAgent ?? null,
    });

    return this.repo.getKitOrThrow(kitId, organizationId);
  }

  async deleteKit(
    organizationId: string,
    kitId: string,
    actor?: {
      userId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const current = await this.repo.getKitOrThrow(kitId, organizationId);

    await this.repo.deleteKit(organizationId, kitId);

    await this.audit.log({
      organizationId,
      userId: actor?.userId ?? null,
      entityType: AuditEntityType.INVENTORY_KIT,
      entityId: kitId,
      action: AuditActionType.DELETED,
      message: "INVENTORY_KIT_DELETED",
      changes: {
        name: current.name,
      },
      ip: actor?.ip ?? null,
      userAgent: actor?.userAgent ?? null,
    });

    return {
      id: kitId,
      deleted: true,
    };
  }

  async applyKitToEvent(params: {
    organizationId: string;
    eventId: string;
    kitId: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    const kit = await this.repo.getKitOrThrow(params.kitId, params.organizationId);

    let assignedCount = 0;
    const missingItems: Array<{ name: string; categoryId?: string; quantity: number }> = [];

    await this.repo.transaction(async (tx) => {
      const alreadyAssigned = new Set<string>();

      for (const item of kit.items) {
        if (item.assetId) {
          if (alreadyAssigned.has(item.assetId)) {
            missingItems.push({
              name: item.name,
              categoryId: item.categoryId ?? undefined,
              quantity: item.quantity,
            });
            continue;
          }

          const asset = await tx.asset.findFirst({
            where: {
              id: item.assetId,
              organizationId: params.organizationId,
              status: AssetStatus.IN_STORAGE,
              quantity: { gt: 0 },
            },
          });

          if (!asset) {
            missingItems.push({
              name: item.name,
              categoryId: item.categoryId ?? undefined,
              quantity: item.quantity,
            });
            continue;
          }

          const quantityToAssign = Math.min(item.quantity, asset.quantity);

          await this.repo.checkoutAssetTx(tx, {
            organizationId: params.organizationId,
            assetId: asset.id,
            eventId: params.eventId,
            quantity: quantityToAssign,
            performedByUserId: params.performedByUserId,
            notes: `Applied from kit ${kit.name}`,
          });

          alreadyAssigned.add(asset.id);
          assignedCount += quantityToAssign;

          if (item.quantity > quantityToAssign) {
            missingItems.push({
              name: item.name,
              categoryId: item.categoryId ?? undefined,
              quantity: item.quantity - quantityToAssign,
            });
          }

          continue;
        }

        let remaining = item.quantity;

        const candidates = await tx.asset.findMany({
          where: {
            organizationId: params.organizationId,
            status: AssetStatus.IN_STORAGE,
            quantity: { gt: 0 },
            ...(item.categoryId ? { categoryId: item.categoryId } : {}),
            ...(item.name
              ? {
                  name: {
                    contains: item.name,
                    mode: "insensitive",
                  },
                }
              : {}),
            id: {
              notIn: [...alreadyAssigned],
            },
          },
          orderBy: [{ name: "asc" }, { createdAt: "asc" }],
        });

        for (const asset of candidates) {
          if (remaining <= 0) break;

          const quantityToAssign = Math.min(remaining, asset.quantity);
          if (quantityToAssign < 1) continue;

          await this.repo.checkoutAssetTx(tx, {
            organizationId: params.organizationId,
            assetId: asset.id,
            eventId: params.eventId,
            quantity: quantityToAssign,
            performedByUserId: params.performedByUserId,
            notes: `Applied from kit ${kit.name}`,
          });

          alreadyAssigned.add(asset.id);
          assignedCount += quantityToAssign;
          remaining -= quantityToAssign;
        }

        if (remaining > 0) {
          missingItems.push({
            name: item.name,
            categoryId: item.categoryId ?? undefined,
            quantity: remaining,
          });
        }
      }
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.INVENTORY_KIT,
      entityId: params.kitId,
      action: AuditActionType.OTHER,
      message: "INVENTORY_KIT_APPLIED",
      changes: {
        assignedCount,
        missingItems,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    if (assignedCount < 1) {
      const missingPreview = missingItems
        .slice(0, 3)
        .map((item) => `${item.name} x${item.quantity}`)
        .join(", ");

      throw new ConflictException(
        missingPreview
          ? `Kit could not be applied: no inventory available (${missingPreview})`
          : "Kit could not be applied: no inventory available for required items",
      );
    }

    return {
      assignedCount,
      missingItems,
    };
  }

  async listChecklists(params: {
    organizationId: string;
    eventId?: string;
    status?: InventoryChecklistStatus;
    limit?: number;
    offset?: number;
  }) {
    if (params.eventId) {
      await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    }

    const limit = this.normalizeLimit(params.limit);
    const offset = this.normalizeOffset(params.offset);

    const { data, total } = await this.repo.listChecklists({
      organizationId: params.organizationId,
      eventId: params.eventId,
      status: params.status,
      limit,
      offset,
    });

    return {
      data,
      total,
      limit,
      offset,
    };
  }

  getChecklist(organizationId: string, checklistId: string) {
    return this.repo.getChecklistOrThrow({
      organizationId,
      checklistId,
    });
  }

  async createChecklist(
    params: {
      organizationId: string;
      eventId: string;
      checklistType: InventoryChecklistType;
      responsibleName?: string;
      notes?: string;
      performedByUserId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    const usages = await this.repo.listActiveEventAssetUsages({
      organizationId: params.organizationId,
      eventId: params.eventId,
    });
    const mergedByAsset = new Map<
      string,
      {
        assetId: string;
        assetName: string;
        assetCodeOrTag: string;
        quantityExpected: number;
      }
    >();

    for (const usage of usages) {
      const existing = mergedByAsset.get(usage.asset.id);
      if (!existing) {
        mergedByAsset.set(usage.asset.id, {
          assetId: usage.asset.id,
          assetName: usage.asset.name,
          assetCodeOrTag:
            usage.asset.assetTag ?? usage.asset.serialNumber ?? usage.asset.id,
          quantityExpected: usage.quantity,
        });
        continue;
      }

      existing.quantityExpected += usage.quantity;
    }

    const checklistNumber = await this.generateChecklistNumber(params.organizationId);

    const checklist = await this.repo.createChecklist({
      organizationId: params.organizationId,
      eventId: params.eventId,
      checklistNumber,
      checklistType: params.checklistType,
      responsibleName: this.normalizeText(params.responsibleName),
      notes: this.normalizeText(params.notes),
      items: [...mergedByAsset.values()],
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: params.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.INVENTORY_CHECKLIST,
      entityId: checklist.id,
      action: AuditActionType.CREATED,
      message: "INVENTORY_CHECKLIST_CREATED",
      changes: {
        checklistNumber: checklist.checklistNumber,
        checklistType: checklist.checklistType,
        totalItems: checklist.totalItems,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.repo.getChecklistOrThrow({
      organizationId: params.organizationId,
      checklistId: checklist.id,
    });
  }

  async verifyChecklistItem(params: {
    organizationId: string;
    checklistId: string;
    assetId: string;
    verified: boolean;
    quantityVerified: number;
    verifiedBy: string;
    condition: InventoryChecklistItemCondition;
    notes?: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (!params.verifiedBy.trim()) {
      throw new BadRequestException("verifiedBy is required");
    }

    const updatedChecklist = await this.repo.updateChecklistItem({
      organizationId: params.organizationId,
      checklistId: params.checklistId,
      assetId: params.assetId,
      verified: params.verified,
      quantityVerified: params.quantityVerified,
      verifiedBy: params.verifiedBy.trim(),
      condition: params.condition,
      notes: this.normalizeText(params.notes),
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: updatedChecklist.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.INVENTORY_CHECKLIST,
      entityId: updatedChecklist.id,
      action: AuditActionType.UPDATED,
      message: "INVENTORY_CHECKLIST_UPDATED",
      changes: {
        assetId: params.assetId,
        verified: params.verified,
        quantityVerified: params.quantityVerified,
        condition: params.condition,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.repo.getChecklistOrThrow({
      organizationId: params.organizationId,
      checklistId: updatedChecklist.id,
    });
  }

  async signChecklist(params: {
    organizationId: string;
    checklistId: string;
    signedBy: string;
    signatureData: string;
    performedByUserId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }) {
    if (!params.signedBy.trim()) {
      throw new BadRequestException("signedBy is required");
    }

    const signed = await this.repo.signChecklist({
      organizationId: params.organizationId,
      checklistId: params.checklistId,
      signedBy: params.signedBy.trim(),
      signatureData: params.signatureData,
    });

    await this.audit.log({
      organizationId: params.organizationId,
      eventId: signed.eventId,
      userId: params.performedByUserId ?? null,
      entityType: AuditEntityType.INVENTORY_CHECKLIST,
      entityId: signed.id,
      action: AuditActionType.STATUS_CHANGED,
      message: "INVENTORY_CHECKLIST_SIGNED",
      changes: {
        signedBy: signed.signedBy,
        signedAt: signed.signedAt,
      },
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
    });

    return this.repo.getChecklistOrThrow({
      organizationId: params.organizationId,
      checklistId: signed.id,
    });
  }

  async deleteChecklist(
    organizationId: string,
    checklistId: string,
    actor?: {
      userId?: string | null;
      ip?: string | null;
      userAgent?: string | null;
    },
  ) {
    const current = await this.repo.getChecklistOrThrow({
      organizationId,
      checklistId,
    });

    await this.repo.deleteChecklist(organizationId, checklistId);

    await this.audit.log({
      organizationId,
      eventId: current.eventId,
      userId: actor?.userId ?? null,
      entityType: AuditEntityType.INVENTORY_CHECKLIST,
      entityId: checklistId,
      action: AuditActionType.DELETED,
      message: "INVENTORY_CHECKLIST_DELETED",
      changes: {
        checklistNumber: current.checklistNumber,
      },
      ip: actor?.ip ?? null,
      userAgent: actor?.userAgent ?? null,
    });

    return {
      id: checklistId,
      deleted: true,
    };
  }

  async getDashboardStats(params: { organizationId: string; eventId?: string }) {
    if (params.eventId) {
      await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    }

    const [
      totalAssets,
      inStorageCount,
      inUseCount,
      damagedCount,
      lostCount,
      groupedCategories,
      recentMovements,
    ] = await Promise.all([
      this.repo.countAssets({
        organizationId: params.organizationId,
        eventId: params.eventId,
      }),
      this.repo.countAssets({
        organizationId: params.organizationId,
        eventId: params.eventId,
        status: AssetStatus.IN_STORAGE,
      }),
      this.repo.countAssets({
        organizationId: params.organizationId,
        eventId: params.eventId,
        status: AssetStatus.IN_USE,
      }),
      this.repo.countAssets({
        organizationId: params.organizationId,
        eventId: params.eventId,
        status: AssetStatus.DAMAGED,
      }),
      this.repo.countAssets({
        organizationId: params.organizationId,
        eventId: params.eventId,
        status: AssetStatus.LOST,
      }),
      this.repo.groupAssetsByCategory({
        organizationId: params.organizationId,
        eventId: params.eventId,
      }),
      this.repo.listRecentMovements({
        organizationId: params.organizationId,
        eventId: params.eventId,
        take: 10,
      }),
    ]);

    const categoryIds = groupedCategories
      .map((row) => row.categoryId)
      .filter((id): id is string => Boolean(id));

    const categories = await this.repo.findCategoryNames([...new Set(categoryIds)]);
    const categoriesMap = new Map(categories.map((category) => [category.id, category.name]));

    const movementUserIds = [
      ...new Set(
        recentMovements
          .map((movement) => movement.performedByUserId)
          .filter(Boolean),
      ),
    ] as string[];
    const movementUsers = await this.repo.listUsersByIds(movementUserIds);
    const movementUsersMap = this.mapPerformerMap(movementUsers);

    return {
      totalAssets,
      inStorageCount,
      inUseCount,
      damagedCount,
      lostCount,
      byCategory: groupedCategories.map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryId
          ? (categoriesMap.get(row.categoryId) ?? "Unknown")
          : "Uncategorized",
        count: row._count._all,
      })),
      recentMovements: recentMovements.map((movement) => ({
        id: movement.id,
        assetId: movement.assetId,
        eventId: movement.eventId,
        performedByUserId: movement.performedByUserId,
        timestamp: movement.checkoutAt,
        movementType: movement.movementType,
        assetName: movement.assetName,
        eventName: movement.eventName ?? movement.event?.name ?? null,
        performedBy: movement.performedByUserId
          ? (movementUsersMap.get(movement.performedByUserId) ?? movement.performedByUserId)
          : null,
        quantity: movement.quantity,
      })),
    };
  }

  async getAssetQr(organizationId: string, assetId: string) {
    const asset = await this.repo.getAssetOrThrow(assetId, organizationId);

    let storedQr = asset.qrCode;
    const generatedQr = this.qr.generateAssetQrContent(asset.id);
    const normalizedQr =
      storedQr && storedQr.startsWith("ASSET:") ? storedQr : generatedQr;

    if (storedQr !== normalizedQr) {
      await this.repo.updateAsset({
        assetId: asset.id,
        organizationId,
        data: {
          qrCode: normalizedQr,
        },
      });
      storedQr = normalizedQr;
    }

    const { qrContent, qrImage } = this.qr.resolveStoredQr(
      storedQr,
      asset.id,
      asset.qrImageUrl,
    );

    return {
      id: asset.id,
      qrContent,
      qrImage,
    };
  }

  async scanQrData(organizationId: string, qrData: string) {
    const payload = qrData.trim();

    if (payload.startsWith("ASSET:")) {
      const assetId = payload.slice("ASSET:".length).trim();
      if (!assetId) {
        throw new BadRequestException("Invalid ASSET QR payload");
      }

      let asset;
      try {
        asset = await this.repo.getAssetOrThrow(assetId, organizationId);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException("Invalid ASSET QR payload");
        }
        throw error;
      }
      const currentUsage = await this.repo.findCurrentEventUsageByAsset({
        organizationId,
        assetId: asset.id,
      });

      return {
        type: "asset",
        data: {
          id: asset.id,
          name: asset.name,
          status: asset.status,
          currentEvent: currentUsage?.event
            ? {
                id: currentUsage.event.id,
                name: currentUsage.event.name,
              }
            : null,
        },
      };
    }

    if (payload.startsWith("CHECKLIST:") || payload.startsWith("EVENT:")) {
      throw new BadRequestException("QR type not supported yet");
    }

    throw new BadRequestException("Invalid QR payload");
  }
}
