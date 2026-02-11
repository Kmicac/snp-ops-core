import { ConflictException } from "@nestjs/common";
import {
  AssetCondition,
  AssetStatus,
  InventoryMovementType,
} from "@prisma/client";
import { InventoryRepo } from "./inventory.repo";

describe("InventoryRepo stock transitions", () => {
  const orgId = "org-1";
  const assetId = "asset-1";
  const eventId = "event-1";

  const buildRepo = () => {
    const tx = {
      asset: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      event: {
        findFirst: jest.fn(),
      },
      assetUsage: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (cb: any) => cb(tx)),
    } as any;

    const repo = new InventoryRepo(prisma);
    return { repo, tx };
  };

  it("decrements quantity on checkout and keeps IN_STORAGE when stock remains", async () => {
    const { repo, tx } = buildRepo();

    tx.asset.findFirst.mockResolvedValue({
      id: assetId,
      organizationId: orgId,
      name: "Camera A",
      quantity: 3,
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.GOOD,
    });
    tx.event.findFirst.mockResolvedValue({ id: eventId, name: "ADCC" });
    tx.assetUsage.create.mockResolvedValue({
      id: "usage-1",
      assetId,
      eventId,
      quantity: 2,
    });

    await repo.createCheckoutWithAssetUpdate({
      organizationId: orgId,
      assetId,
      eventId,
      quantity: 2,
    });

    expect(tx.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: assetId },
        data: expect.objectContaining({
          quantity: 1,
          status: AssetStatus.IN_STORAGE,
        }),
      }),
    );
  });

  it("throws conflict when checkout quantity exceeds stock", async () => {
    const { repo, tx } = buildRepo();

    tx.asset.findFirst.mockResolvedValue({
      id: assetId,
      organizationId: orgId,
      name: "Camera A",
      quantity: 1,
      status: AssetStatus.IN_STORAGE,
      condition: AssetCondition.GOOD,
    });

    await expect(
      repo.createCheckoutWithAssetUpdate({
        organizationId: orgId,
        assetId,
        eventId,
        quantity: 2,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("increments quantity on return and marks CHECK_IN movement", async () => {
    const { repo, tx } = buildRepo();

    tx.assetUsage.findFirst.mockResolvedValue({
      id: "usage-1",
      assetId,
      eventId,
      zoneId: null,
      staffMemberId: null,
      quantity: 2,
      returnedAt: null,
      conditionOut: AssetCondition.GOOD,
      assetName: "Camera A",
      eventName: "ADCC",
      asset: {
        id: assetId,
        quantity: 0,
      },
      event: {
        id: eventId,
        name: "ADCC",
      },
    });
    tx.assetUsage.update.mockResolvedValue({
      id: "usage-1",
      assetId,
      eventId,
      returnedAt: new Date(),
    });
    tx.assetUsage.count.mockResolvedValue(0);

    await repo.returnUsageWithAssetUpdate({
      organizationId: orgId,
      usageId: "usage-1",
    });

    expect(tx.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: assetId },
        data: expect.objectContaining({
          quantity: 2,
          status: AssetStatus.IN_STORAGE,
        }),
      }),
    );

    expect(tx.assetUsage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: InventoryMovementType.CHECK_IN,
          quantity: 2,
        }),
      }),
    );
  });
});
