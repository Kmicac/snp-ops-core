import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  AssetUsage,
  InventoryChecklist,
  InventoryChecklistItem,
  InventoryChecklistItemCondition,
  InventoryChecklistStatus,
  InventoryChecklistType,
  InventoryKit,
  InventoryKitItem,
  InventoryMovementType,
  Prisma,
  User,
} from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";

type Tx = Prisma.TransactionClient;
export type InventoryTx = Tx;

export type ListMovementsParams = {
  organizationId: string;
  assetId?: string;
  eventId?: string;
  movementType?: InventoryMovementType;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
};

export type MovementRow = AssetUsage & {
  asset: {
    id: string;
    name: string;
    status: AssetStatus;
    organizationId: string;
  };
  event: {
    id: string;
    name: string;
  } | null;
};

@Injectable()
export class InventoryRepo {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(handler: (tx: Tx) => Promise<T>) {
    return this.prisma.$transaction((tx) => handler(tx));
  }

  // -------- Categorias --------

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

  async getCategoryOrThrow(
    categoryId: string,
    organizationId: string,
  ): Promise<AssetCategory> {
    const category = await this.prisma.assetCategory.findFirst({
      where: { id: categoryId, organizationId },
    });
    if (!category) {
      throw new NotFoundException("Asset category not found");
    }
    return category;
  }

  updateCategory(params: {
    categoryId: string;
    data: Prisma.AssetCategoryUpdateInput;
  }): Promise<AssetCategory> {
    return this.prisma.assetCategory.update({
      where: { id: params.categoryId },
      data: params.data,
    });
  }

  // -------- Assets --------

  async createAsset(params: {
    organizationId: string;
    name: string;
    categoryId?: string;
    assetTag?: string;
    serialNumber?: string;
    description?: string;
    location?: string;
    quantity?: number;
    purchasePrice?: Prisma.Decimal | number;
    purchaseDate?: Date;
    supplierName?: string;
    notes?: string;
    qrCode?: string;
    imageUrl?: string;
    imageKey?: string;
    qrImageUrl?: string;
    qrImageKey?: string;
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
      supplierName,
      notes,
      qrCode,
      imageUrl,
      imageKey,
      qrImageUrl,
      qrImageKey,
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
        location: location ?? "Main warehouse",
        quantity: quantity ?? 1,
        purchasePrice,
        purchaseDate,
        supplierName,
        notes,
        qrCode,
        imageUrl,
        imageKey,
        qrImageUrl,
        qrImageKey,
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
    data: Prisma.AssetUpdateInput;
  }): Promise<Asset> {
    const { assetId, data } = params;
    return this.prisma.asset.update({
      where: { id: assetId },
      data,
    });
  }

  async countActiveCheckoutsForAsset(params: {
    organizationId: string;
    assetId: string;
  }): Promise<number> {
    return this.prisma.assetUsage.count({
      where: {
        assetId: params.assetId,
        movementType: InventoryMovementType.CHECK_OUT,
        returnedAt: null,
        asset: { organizationId: params.organizationId },
      },
    });
  }

  async countAnyUsagesForAsset(params: {
    organizationId: string;
    assetId: string;
  }): Promise<number> {
    return this.prisma.assetUsage.count({
      where: {
        assetId: params.assetId,
        asset: { organizationId: params.organizationId },
      },
    });
  }

  async countKitItemsForAsset(params: {
    organizationId: string;
    assetId: string;
  }): Promise<number> {
    return this.prisma.inventoryKitItem.count({
      where: {
        assetId: params.assetId,
        kit: { organizationId: params.organizationId },
      },
    });
  }

  async countChecklistItemsForAsset(params: {
    organizationId: string;
    assetId: string;
  }): Promise<number> {
    return this.prisma.inventoryChecklistItem.count({
      where: {
        assetId: params.assetId,
        checklist: { organizationId: params.organizationId },
      },
    });
  }

  async countEventResourcesForAsset(params: {
    organizationId: string;
    assetId: string;
  }): Promise<number> {
    return this.prisma.eventResource.count({
      where: {
        organizationId: params.organizationId,
        assetId: params.assetId,
      },
    });
  }

  async deleteAsset(params: {
    organizationId: string;
    assetId: string;
  }): Promise<void> {
    await this.prisma.asset.deleteMany({
      where: { id: params.assetId, organizationId: params.organizationId },
    });
  }

  // -------- Assertions --------

  async assertEventInOrg(eventId: string, organizationId: string): Promise<{ id: string; name: string }> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, organizationId },
      select: { id: true, name: true },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return event;
  }

  async assertZoneInEvent(zoneId: string, eventId: string): Promise<void> {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, eventId },
      select: { id: true },
    });

    if (!zone) {
      throw new BadRequestException("Zone does not belong to event");
    }
  }

  async assertStaffMemberInOrg(staffMemberId: string, organizationId: string): Promise<void> {
    const found = await this.prisma.staffMember.findFirst({
      where: { id: staffMemberId, organizationId },
      select: { id: true },
    });

    if (!found) {
      throw new BadRequestException("Staff member does not belong to organization");
    }
  }

  async assertAssetsInOrg(assetIds: string[], organizationId: string): Promise<void> {
    if (assetIds.length === 0) return;

    const count = await this.prisma.asset.count({
      where: {
        organizationId,
        id: { in: assetIds },
      },
    });

    if (count !== assetIds.length) {
      throw new BadRequestException("Some assetIds do not belong to organization");
    }
  }

  async assertCategoriesInOrg(categoryIds: string[], organizationId: string): Promise<void> {
    if (categoryIds.length === 0) return;

    const count = await this.prisma.assetCategory.count({
      where: {
        organizationId,
        id: { in: categoryIds },
      },
    });

    if (count !== categoryIds.length) {
      throw new BadRequestException("Some categoryIds do not belong to organization");
    }
  }

  // -------- Usos / Movimientos --------

  async createCheckoutWithAssetUpdate(params: {
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
  }): Promise<AssetUsage> {
    return this.transaction(async (tx) => this.checkoutAssetTx(tx, params));
  }

  async checkoutAssetTx(
    tx: Tx,
    params: {
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
    },
  ): Promise<AssetUsage> {
    const asset = await tx.asset.findFirst({
      where: { id: params.assetId, organizationId: params.organizationId },
    });

    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    if (
      asset.status === AssetStatus.DAMAGED ||
      asset.status === AssetStatus.LOST ||
      asset.status === AssetStatus.UNDER_REPAIR ||
      asset.status === AssetStatus.RETIRED ||
      asset.condition === AssetCondition.BROKEN
    ) {
      throw new ConflictException("Asset is not in a usable status");
    }

    const requestedQuantity = params.quantity ?? 1;
    if (requestedQuantity < 1) {
      throw new BadRequestException("Checkout quantity must be >= 1");
    }

    if (asset.quantity < requestedQuantity) {
      throw new ConflictException("Not enough stock for asset");
    }

    let eventName: string | null = null;
    if (params.eventId) {
      const event = await tx.event.findFirst({
        where: { id: params.eventId, organizationId: params.organizationId },
        select: { id: true, name: true },
      });
      if (!event) {
        throw new NotFoundException("Event not found");
      }
      eventName = event.name;
    }

    const usage = await tx.assetUsage.create({
      data: {
        assetId: asset.id,
        eventId: params.eventId,
        zoneId: params.zoneId,
        staffMemberId: params.staffMemberId,
        movementType: InventoryMovementType.CHECK_OUT,
        performedByUserId: params.performedByUserId ?? null,
        assetName: asset.name,
        eventName,
        quantity: requestedQuantity,
        expectedReturnAt: params.expectedReturnAt,
        conditionOut: params.conditionOut ?? asset.condition,
        notes: params.notes,
      },
    });

    const remainingQuantity = asset.quantity - requestedQuantity;
    const nextStatus =
      remainingQuantity > 0 ? AssetStatus.IN_STORAGE : AssetStatus.IN_USE;

    await tx.asset.update({
      where: { id: asset.id },
      data: {
        quantity: remainingQuantity,
        status: nextStatus,
      },
    });

    return usage;
  }

  async returnUsageWithAssetUpdate(params: {
    organizationId: string;
    usageId: string;
    expectedEventId?: string;
    returnedAt?: Date;
    conditionIn?: AssetCondition;
    notes?: string;
    performedByUserId?: string | null;
  }): Promise<AssetUsage> {
    return this.transaction(async (tx) => {
      const usage = await tx.assetUsage.findFirst({
        where: {
          id: params.usageId,
          movementType: InventoryMovementType.CHECK_OUT,
          asset: {
            organizationId: params.organizationId,
          },
        },
        include: {
          asset: true,
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!usage) {
        throw new NotFoundException("Asset usage not found");
      }

      if (usage.returnedAt) {
        throw new ConflictException("Asset usage is already returned");
      }

      if (params.expectedEventId && usage.eventId !== params.expectedEventId) {
        throw new ConflictException("Asset usage does not belong to this event");
      }

      const returnedAt = params.returnedAt ?? new Date();

      const updatedUsage = await tx.assetUsage.update({
        where: { id: usage.id },
        data: {
          returnedAt,
          conditionIn: params.conditionIn,
          notes: params.notes,
        },
      });

      const nextQuantity = usage.asset.quantity + usage.quantity;
      const openCheckouts = await tx.assetUsage.count({
        where: {
          assetId: usage.assetId,
          movementType: InventoryMovementType.CHECK_OUT,
          returnedAt: null,
          id: { not: usage.id },
        },
      });

      const nextStatus =
        params.conditionIn === AssetCondition.BROKEN
          ? AssetStatus.DAMAGED
          : nextQuantity > 0
            ? AssetStatus.IN_STORAGE
            : openCheckouts > 0
              ? AssetStatus.IN_USE
              : AssetStatus.IN_STORAGE;

      await tx.asset.update({
        where: { id: usage.assetId },
        data: {
          quantity: nextQuantity,
          status: nextStatus,
          condition: params.conditionIn ?? undefined,
        },
      });

      await tx.assetUsage.create({
        data: {
          assetId: usage.assetId,
          eventId: usage.eventId,
          zoneId: usage.zoneId,
          staffMemberId: usage.staffMemberId,
          movementType: InventoryMovementType.CHECK_IN,
          performedByUserId: params.performedByUserId ?? null,
          assetName: usage.assetName,
          eventName: usage.eventName ?? usage.event?.name ?? null,
          quantity: usage.quantity,
          checkoutAt: returnedAt,
          returnedAt,
          conditionOut: usage.conditionOut,
          conditionIn: params.conditionIn,
          notes: params.notes,
        },
      });

      return updatedUsage;
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

  async listMovements(params: ListMovementsParams): Promise<{
    data: MovementRow[];
    total: number;
  }> {
    const where: Prisma.AssetUsageWhereInput = {
      asset: {
        organizationId: params.organizationId,
      },
    };

    if (params.assetId) where.assetId = params.assetId;
    if (params.eventId) where.eventId = params.eventId;
    if (params.movementType) where.movementType = params.movementType;
    if (params.from || params.to) {
      // Filtro inclusivo: checkoutAt >= from y checkoutAt <= to.
      const checkoutAtFilter: Prisma.DateTimeFilter = {};
      if (params.from) checkoutAtFilter.gte = params.from;
      if (params.to) checkoutAtFilter.lte = params.to;
      where.checkoutAt = checkoutAtFilter;
    }

    const [total, data] = await Promise.all([
      this.prisma.assetUsage.count({ where }),
      this.prisma.assetUsage.findMany({
        where,
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              status: true,
              organizationId: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          checkoutAt: "desc",
        },
        skip: params.offset,
        take: params.limit,
      }),
    ]);

    return {
      total,
      data,
    };
  }

  async listRecentMovements(params: {
    organizationId: string;
    eventId?: string;
    take?: number;
  }): Promise<MovementRow[]> {
    const safeTake = Math.max(1, Math.min(params.take ?? 10, 50));

    return this.prisma.assetUsage.findMany({
      where: {
        asset: {
          organizationId: params.organizationId,
        },
        ...(params.eventId ? { eventId: params.eventId } : {}),
      },
      include: {
        asset: {
          select: {
            id: true,
            name: true,
            status: true,
            organizationId: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkoutAt: "desc",
      },
      take: safeTake,
    });
  }

  listUsersByIds(userIds: string[]): Promise<Array<Pick<User, "id" | "fullName" | "email">>> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });
  }

  // -------- Kits --------

  listKits(organizationId: string): Promise<Array<InventoryKit & { _count: { items: number } }>> {
    return this.prisma.inventoryKit.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });
  }

  async getKitOrThrow(kitId: string, organizationId: string): Promise<InventoryKit & {
    items: Array<InventoryKitItem & {
      asset: { id: string; name: string } | null;
      category: { id: string; name: string } | null;
    }>;
  }> {
    const kit = await this.prisma.inventoryKit.findFirst({
      where: {
        id: kitId,
        organizationId,
      },
      include: {
        items: {
          include: {
            asset: {
              select: {
                id: true,
                name: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
      },
    });

    if (!kit) {
      throw new NotFoundException("Inventory kit not found");
    }

    return kit;
  }

  async createKit(params: {
    organizationId: string;
    name: string;
    description?: string | null;
    eventType: string;
    items: Array<{
      assetId?: string | null;
      categoryId?: string | null;
      name: string;
      quantity: number;
    }>;
  }): Promise<InventoryKit> {
    return this.transaction(async (tx) => {
      const kit = await tx.inventoryKit.create({
        data: {
          organizationId: params.organizationId,
          name: params.name,
          description: params.description ?? null,
          eventType: params.eventType,
        },
      });

      if (params.items.length > 0) {
        await tx.inventoryKitItem.createMany({
          data: params.items.map((item) => ({
            kitId: kit.id,
            assetId: item.assetId ?? null,
            categoryId: item.categoryId ?? null,
            name: item.name,
            quantity: item.quantity,
          })),
        });
      }

      return kit;
    });
  }

  async updateKit(params: {
    organizationId: string;
    kitId: string;
    data: Prisma.InventoryKitUpdateInput;
    items?: Array<{
      assetId?: string | null;
      categoryId?: string | null;
      name: string;
      quantity: number;
    }>;
  }): Promise<InventoryKit> {
    return this.transaction(async (tx) => {
      const current = await tx.inventoryKit.findFirst({
        where: {
          id: params.kitId,
          organizationId: params.organizationId,
        },
      });

      if (!current) {
        throw new NotFoundException("Inventory kit not found");
      }

      const updated = await tx.inventoryKit.update({
        where: { id: current.id },
        data: params.data,
      });

      if (params.items) {
        await tx.inventoryKitItem.deleteMany({
          where: { kitId: current.id },
        });

        if (params.items.length > 0) {
          await tx.inventoryKitItem.createMany({
            data: params.items.map((item) => ({
              kitId: current.id,
              assetId: item.assetId ?? null,
              categoryId: item.categoryId ?? null,
              name: item.name,
              quantity: item.quantity,
            })),
          });
        }
      }

      return updated;
    });
  }

  async deleteKit(organizationId: string, kitId: string): Promise<void> {
    const current = await this.prisma.inventoryKit.findFirst({
      where: {
        id: kitId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!current) {
      throw new NotFoundException("Inventory kit not found");
    }

    await this.prisma.inventoryKit.delete({
      where: {
        id: current.id,
      },
    });
  }

  async findAssetsForKitItem(params: {
    organizationId: string;
    categoryId?: string;
    name?: string;
    excludeAssetIds?: string[];
  }): Promise<Asset[]> {
    return this.prisma.asset.findMany({
      where: {
        organizationId: params.organizationId,
        status: AssetStatus.IN_STORAGE,
        quantity: { gt: 0 },
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.name
          ? {
              name: {
                contains: params.name,
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.excludeAssetIds && params.excludeAssetIds.length > 0
          ? {
              id: {
                notIn: params.excludeAssetIds,
              },
            }
          : {}),
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    });
  }

  // -------- Checklists --------

  listChecklists(params: {
    organizationId: string;
    eventId?: string;
    status?: InventoryChecklistStatus;
    limit: number;
    offset: number;
  }): Promise<{ data: Array<InventoryChecklist & { event: { id: string; name: string } }>; total: number }> {
    const where: Prisma.InventoryChecklistWhereInput = {
      organizationId: params.organizationId,
      eventId: params.eventId,
      status: params.status,
    };

    return Promise.all([
      this.prisma.inventoryChecklist.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: params.offset,
        take: params.limit,
      }),
      this.prisma.inventoryChecklist.count({ where }),
    ]).then(([data, total]) => ({ data, total }));
  }

  async getChecklistOrThrow(params: {
    organizationId: string;
    checklistId: string;
  }): Promise<
    InventoryChecklist & {
      event: { id: string; name: string };
      items: Array<InventoryChecklistItem & { asset: { id: string; name: string; assetTag: string | null; serialNumber: string | null } }>;
    }
  > {
    const checklist = await this.prisma.inventoryChecklist.findFirst({
      where: {
        id: params.checklistId,
        organizationId: params.organizationId,
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            asset: {
              select: {
                id: true,
                name: true,
                assetTag: true,
                serialNumber: true,
              },
            },
          },
          orderBy: {
            assetName: "asc",
          },
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException("Inventory checklist not found");
    }

    return checklist;
  }

  async createChecklist(params: {
    organizationId: string;
    eventId: string;
    checklistNumber: string;
    checklistType: InventoryChecklistType;
    responsibleName?: string;
    notes?: string;
    items: Array<{
      assetId: string;
      assetName: string;
      assetCodeOrTag: string;
      quantityExpected: number;
      quantityVerified?: number;
      condition?: InventoryChecklistItemCondition;
      notes?: string;
    }>;
  }): Promise<InventoryChecklist> {
    return this.transaction(async (tx) => {
      const checklist = await tx.inventoryChecklist.create({
        data: {
          organizationId: params.organizationId,
          eventId: params.eventId,
          checklistNumber: params.checklistNumber,
          checklistType: params.checklistType,
          responsibleName: params.responsibleName,
          notes: params.notes,
          status: InventoryChecklistStatus.PENDING,
          totalItems: params.items.length,
          verifiedItems: 0,
          missingItems: 0,
        },
      });

      if (params.items.length > 0) {
        await tx.inventoryChecklistItem.createMany({
          data: params.items.map((item) => ({
            checklistId: checklist.id,
            assetId: item.assetId,
            assetName: item.assetName,
            assetCodeOrTag: item.assetCodeOrTag,
            quantityExpected: item.quantityExpected,
            quantityVerified: item.quantityVerified ?? 0,
            condition: item.condition ?? InventoryChecklistItemCondition.GOOD,
            notes: item.notes,
          })),
        });
      }

      return checklist;
    });
  }

  async existsChecklistNumber(
    organizationId: string,
    checklistNumber: string,
  ): Promise<boolean> {
    const count = await this.prisma.inventoryChecklist.count({
      where: {
        organizationId,
        checklistNumber,
      },
    });

    return count > 0;
  }

  async updateChecklistItem(params: {
    organizationId: string;
    checklistId: string;
    assetId: string;
    verified: boolean;
    quantityVerified: number;
    verifiedBy: string;
    condition: InventoryChecklistItemCondition;
    notes?: string;
  }): Promise<InventoryChecklist> {
    return this.transaction(async (tx) => {
      const checklist = await tx.inventoryChecklist.findFirst({
        where: {
          id: params.checklistId,
          organizationId: params.organizationId,
        },
      });

      if (!checklist) {
        throw new NotFoundException("Inventory checklist not found");
      }

      if (checklist.status === InventoryChecklistStatus.SIGNED) {
        throw new ConflictException("Signed checklist cannot be modified");
      }

      const item = await tx.inventoryChecklistItem.findFirst({
        where: {
          checklistId: checklist.id,
          assetId: params.assetId,
        },
        orderBy: {
          id: "asc",
        },
      });

      if (!item) {
        throw new NotFoundException("Checklist item not found for this asset");
      }

      if (params.quantityVerified > item.quantityExpected) {
        throw new BadRequestException("quantityVerified cannot exceed quantityExpected");
      }

      await tx.inventoryChecklistItem.update({
        where: {
          id: item.id,
        },
        data: {
          verified: params.verified,
          quantityVerified: params.quantityVerified,
          verifiedBy: params.verifiedBy,
          verifiedAt: new Date(),
          condition: params.condition,
          notes: params.notes,
        },
      });

      const items = await tx.inventoryChecklistItem.findMany({
        where: {
          checklistId: checklist.id,
        },
      });

      const verifiedItems = items.filter((row) => row.verified).length;
      const missingItems = items.filter(
        (row) => row.condition === InventoryChecklistItemCondition.MISSING,
      ).length;

      const hasPending = items.some(
        (row) =>
          !row.verified &&
          row.condition !== InventoryChecklistItemCondition.MISSING &&
          row.condition !== InventoryChecklistItemCondition.DAMAGED,
      );

      const nextStatus = hasPending
        ? InventoryChecklistStatus.IN_PROGRESS
        : InventoryChecklistStatus.COMPLETED;

      return tx.inventoryChecklist.update({
        where: {
          id: checklist.id,
        },
        data: {
          verifiedItems,
          missingItems,
          status: nextStatus,
        },
      });
    });
  }

  async signChecklist(params: {
    organizationId: string;
    checklistId: string;
    signedBy: string;
    signatureData: string;
  }): Promise<InventoryChecklist> {
    return this.transaction(async (tx) => {
      const checklist = await tx.inventoryChecklist.findFirst({
        where: {
          id: params.checklistId,
          organizationId: params.organizationId,
        },
      });

      if (!checklist) {
        throw new NotFoundException("Inventory checklist not found");
      }

      if (checklist.status !== InventoryChecklistStatus.COMPLETED) {
        throw new ConflictException("Checklist must be completed before signature");
      }

      return tx.inventoryChecklist.update({
        where: {
          id: checklist.id,
        },
        data: {
          signedBy: params.signedBy,
          signatureData: params.signatureData,
          signedAt: new Date(),
          status: InventoryChecklistStatus.SIGNED,
        },
      });
    });
  }

  async deleteChecklist(organizationId: string, checklistId: string): Promise<void> {
    const checklist = await this.prisma.inventoryChecklist.findFirst({
      where: {
        id: checklistId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!checklist) {
      throw new NotFoundException("Inventory checklist not found");
    }

    await this.prisma.inventoryChecklist.delete({
      where: {
        id: checklist.id,
      },
    });
  }

  async listActiveEventAssetUsages(params: {
    organizationId: string;
    eventId: string;
  }): Promise<Array<AssetUsage & { asset: Asset }>> {
    return this.prisma.assetUsage.findMany({
      where: {
        eventId: params.eventId,
        movementType: InventoryMovementType.CHECK_OUT,
        returnedAt: null,
        asset: {
          organizationId: params.organizationId,
        },
      },
      include: {
        asset: true,
      },
      orderBy: {
        checkoutAt: "asc",
      },
    });
  }

  // -------- Dashboard / Scan --------

  countAssets(params: {
    organizationId: string;
    eventId?: string;
    status?: AssetStatus;
  }): Promise<number> {
    if (params.eventId) {
      return this.prisma.asset.count({
        where: {
          organizationId: params.organizationId,
          status: params.status,
          usages: {
            some: {
              eventId: params.eventId,
              movementType: InventoryMovementType.CHECK_OUT,
              returnedAt: null,
            },
          },
        },
      });
    }

    return this.prisma.asset.count({
      where: {
        organizationId: params.organizationId,
        status: params.status,
      },
    });
  }

  async groupAssetsByCategory(params: {
    organizationId: string;
    eventId?: string;
  }): Promise<Array<{ categoryId: string | null; _count: { _all: number } }>> {
    const rows = await this.prisma.asset.groupBy({
      by: ["categoryId"],
      where: {
        organizationId: params.organizationId,
        ...(params.eventId
          ? {
              usages: {
                some: {
                  eventId: params.eventId,
                  movementType: InventoryMovementType.CHECK_OUT,
                  returnedAt: null,
                },
              },
            }
          : {}),
      },
      _count: {
        _all: true,
      },
    });

    return rows.map((row) => ({
      categoryId: row.categoryId,
      _count: {
        _all: row._count._all,
      },
    }));
  }

  async findCategoryNames(categoryIds: string[]): Promise<Array<{ id: string; name: string }>> {
    if (categoryIds.length === 0) {
      return [];
    }

    return this.prisma.assetCategory.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async findCurrentEventUsageByAsset(params: {
    organizationId: string;
    assetId: string;
  }) {
    return this.prisma.assetUsage.findFirst({
      where: {
        assetId: params.assetId,
        movementType: InventoryMovementType.CHECK_OUT,
        returnedAt: null,
        asset: {
          organizationId: params.organizationId,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkoutAt: "desc",
      },
    });
  }
}
