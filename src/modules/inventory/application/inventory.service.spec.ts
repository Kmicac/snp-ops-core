import { BadRequestException } from "@nestjs/common";
import {
  AssetStatus,
  InventoryChecklistItemCondition,
  InventoryChecklistType,
  InventoryMovementType,
} from "@prisma/client";
import { InventoryService } from "./inventory.service";

describe("InventoryService", () => {
  const buildService = () => {
    const repo: Record<string, any> = {
      getCategoryOrThrow: jest.fn(),
      createAsset: jest.fn(),
      updateAsset: jest.fn(),
      getAssetOrThrow: jest.fn(),
      assertEventInOrg: jest.fn(),
      assertZoneInEvent: jest.fn(),
      assertStaffMemberInOrg: jest.fn(),
      createCheckoutWithAssetUpdate: jest.fn(),
      returnUsageWithAssetUpdate: jest.fn(),
      listMovements: jest.fn(),
      listUsersByIds: jest.fn(),
      getKitOrThrow: jest.fn(),
      transaction: jest.fn(),
      checkoutAssetTx: jest.fn(),
      existsChecklistNumber: jest.fn(),
      listActiveEventAssetUsages: jest.fn(),
      createChecklist: jest.fn(),
      getChecklistOrThrow: jest.fn(),
      updateChecklistItem: jest.fn(),
      signChecklist: jest.fn(),
      countAssets: jest.fn(),
      groupAssetsByCategory: jest.fn(),
      findCategoryNames: jest.fn(),
      listRecentMovements: jest.fn(),
      findCurrentEventUsageByAsset: jest.fn(),
    };

    const audit = { log: jest.fn() };
    const qr = {
      generateAssetQrContent: jest.fn((id: string) => `ASSET:${id}`),
      resolveStoredQr: jest.fn((stored: string | null, id: string, image?: string | null) => ({
        qrContent: stored ?? `ASSET:${id}`,
        qrImage: image ?? null,
      })),
    };

    const service = new InventoryService(repo as any, audit as any, qr as any);
    return { service, repo, audit, qr };
  };

  it("stores asset image and qr image metadata on create", async () => {
    const { service, repo } = buildService();

    repo.createAsset.mockResolvedValue({
      id: "asset-1",
      name: "iPad",
      qrCode: null,
      status: AssetStatus.IN_STORAGE,
      condition: "GOOD",
    });
    repo.updateAsset.mockResolvedValue({
      id: "asset-1",
      name: "iPad",
      qrCode: "ASSET:asset-1",
      status: AssetStatus.IN_STORAGE,
      condition: "GOOD",
    });

    await service.createAsset("org-1", {
      name: "iPad",
      quantity: 3,
      imageUrl: "https://cdn/assets/ipad.png",
      imageKey: "orgs/org-1/assets/ipad.png",
      qrImageUrl: "https://cdn/assets-qr/ipad.png",
      qrImageKey: "orgs/org-1/assets-qr/ipad.png",
    });

    expect(repo.createAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: "https://cdn/assets/ipad.png",
        imageKey: "orgs/org-1/assets/ipad.png",
        qrImageUrl: "https://cdn/assets-qr/ipad.png",
        qrImageKey: "orgs/org-1/assets-qr/ipad.png",
      }),
    );
  });

  it("validates checkout quantity >= 1", async () => {
    const { service } = buildService();

    await expect(
      service.checkoutAsset({
        organizationId: "org-1",
        eventId: "event-1",
        assetId: "asset-1",
        quantity: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("applies kit with limited stock and reports missing items", async () => {
    const { service, repo } = buildService();

    repo.getKitOrThrow.mockResolvedValue({
      id: "kit-1",
      name: "Kit A",
      items: [
        { assetId: null, categoryId: "cat-1", name: "Tablet", quantity: 5 },
      ],
    });

    repo.transaction.mockImplementation(async (handler: any) => {
      const tx = {
        asset: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([
            { id: "a-1", quantity: 2 },
            { id: "a-2", quantity: 1 },
          ]),
        },
      };
      await handler(tx);
    });

    repo.checkoutAssetTx.mockResolvedValue({ id: "usage-x" });

    const result = await service.applyKitToEvent({
      organizationId: "org-1",
      eventId: "event-1",
      kitId: "kit-1",
    });

    expect(result.assignedCount).toBe(3);
    expect(result.missingItems).toEqual([
      {
        name: "Tablet",
        categoryId: "cat-1",
        quantity: 2,
      },
    ]);
  });

  it("aggregates checklist quantities by asset and supports verify/sign flow", async () => {
    const { service, repo } = buildService();

    repo.existsChecklistNumber.mockResolvedValue(false);
    repo.listActiveEventAssetUsages.mockResolvedValue([
      {
        quantity: 1,
        asset: { id: "asset-1", name: "Camera", assetTag: "CAM-1", serialNumber: null },
      },
      {
        quantity: 2,
        asset: { id: "asset-1", name: "Camera", assetTag: "CAM-1", serialNumber: null },
      },
    ]);
    repo.createChecklist.mockResolvedValue({
      id: "chk-1",
      checklistNumber: "CHK-20260211-ABCD",
      checklistType: InventoryChecklistType.LOADING,
      totalItems: 1,
    });
    repo.getChecklistOrThrow.mockResolvedValue({
      id: "chk-1",
      eventId: "event-1",
      status: "PENDING",
    });

    await service.createChecklist({
      organizationId: "org-1",
      eventId: "event-1",
      checklistType: InventoryChecklistType.LOADING,
    });

    expect(repo.createChecklist).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            assetId: "asset-1",
            quantityExpected: 3,
          }),
        ],
      }),
    );

    repo.updateChecklistItem.mockResolvedValue({ id: "chk-1", eventId: "event-1" });
    await service.verifyChecklistItem({
      organizationId: "org-1",
      checklistId: "chk-1",
      assetId: "asset-1",
      verified: true,
      quantityVerified: 3,
      verifiedBy: "Carlos",
      condition: InventoryChecklistItemCondition.GOOD,
    });

    repo.signChecklist.mockResolvedValue({ id: "chk-1", eventId: "event-1" });
    await service.signChecklist({
      organizationId: "org-1",
      checklistId: "chk-1",
      signedBy: "Carlos",
      signatureData: "data:image/png;base64,abc",
    });

    expect(repo.signChecklist).toHaveBeenCalledWith(
      expect.objectContaining({ signedBy: "Carlos" }),
    );
  });

  it("returns dashboard stats in simple scenario", async () => {
    const { service, repo } = buildService();

    repo.countAssets
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);

    repo.groupAssetsByCategory.mockResolvedValue([
      { categoryId: "cat-1", _count: { _all: 4 } },
      { categoryId: null, _count: { _all: 1 } },
    ]);
    repo.findCategoryNames.mockResolvedValue([{ id: "cat-1", name: "Cameras" }]);

    repo.listRecentMovements.mockResolvedValue([
      {
        checkoutAt: new Date(),
        movementType: InventoryMovementType.CHECK_OUT,
        assetName: "Camera A",
        eventName: "ADCC",
        performedByUserId: "u-1",
        quantity: 1,
        event: { id: "event-1", name: "ADCC" },
      },
    ]);

    repo.listUsersByIds.mockResolvedValue([{ id: "u-1", fullName: "Carlos", email: "c@snp.com" }]);

    const stats = await service.getDashboardStats({ organizationId: "org-1" });

    expect(stats.totalAssets).toBe(5);
    expect(stats.byCategory[0]).toEqual(
      expect.objectContaining({ categoryName: "Cameras", count: 4 }),
    );
  });

  it("returns qrContent only when qr image is missing", async () => {
    const { service, repo } = buildService();

    repo.getAssetOrThrow.mockResolvedValue({ id: "asset-1", qrCode: null, qrImageUrl: null });
    repo.updateAsset.mockResolvedValue({});

    const result = await service.getAssetQr("org-1", "asset-1");
    expect(result).toEqual({
      id: "asset-1",
      qrContent: "ASSET:asset-1",
      qrImage: null,
    });
  });

  it("returns qr image when qrImageUrl exists", async () => {
    const { service, repo } = buildService();

    repo.getAssetOrThrow.mockResolvedValue({
      id: "asset-1",
      qrCode: "ASSET:asset-1",
      qrImageUrl: "https://cdn/assets-qr/asset-1.png",
    });

    const result = await service.getAssetQr("org-1", "asset-1");
    expect(result).toEqual({
      id: "asset-1",
      qrContent: "ASSET:asset-1",
      qrImage: "https://cdn/assets-qr/asset-1.png",
    });
  });
});
