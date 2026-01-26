import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { InventoryService } from "../application/inventory.service";
import { CreateAssetCategoryDto } from "./dto/create-asset-category.dto";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";
import { CheckoutAssetDto } from "./dto/checkout-asset.dto";
import { ReturnAssetDto } from "./dto/return-asset.dto";
import { AssetStatus } from "@prisma/client";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller()
export class InventoryController {
  constructor(private readonly service: InventoryService) {}


  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("orgs/:orgId/asset-categories")
  createCategory(
    @Param("orgId") orgId: string,
    @Body() dto: CreateAssetCategoryDto,
  ) {
    return this.service.createCategory(orgId, dto);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("orgs/:orgId/asset-categories")
  listCategories(@Param("orgId") orgId: string) {
    return this.service.listCategories(orgId);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("orgs/:orgId/assets")
  createAsset(
    @Param("orgId") orgId: string,
    @Body() dto: CreateAssetDto,
  ) {
    return this.service.createAsset(orgId, {
      ...dto,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("orgs/:orgId/assets")
  listAssets(
    @Param("orgId") orgId: string,
    @Query("categoryId") categoryId?: string,
    @Query("status") status?: AssetStatus,
  ) {
    return this.service.listAssets(orgId, {
      categoryId: categoryId || undefined,
      status: status || undefined,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Patch("orgs/:orgId/assets/:assetId")
  updateAsset(
    @Param("orgId") orgId: string,
    @Param("assetId") assetId: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.service.updateAsset(orgId, assetId, {
      ...dto,
      purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
    });
  }


  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("orgs/:orgId/events/:eventId/assets/:assetId/checkout")
  checkoutAsset(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("assetId") assetId: string,
    @Body() dto: CheckoutAssetDto,
  ) {
    return this.service.checkoutAsset({
      organizationId: orgId,
      assetId,
      eventId,
      zoneId: dto.zoneId,
      staffMemberId: dto.staffMemberId,
      quantity: dto.quantity,
      expectedReturnAt: dto.expectedReturnAt
        ? new Date(dto.expectedReturnAt)
        : undefined,
      conditionOut: dto.conditionOut,
      notes: dto.notes,
    });
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("orgs/:orgId/events/:eventId/assets-usage/:usageId/return")
  returnAsset(
    @Param("orgId") orgId: string,
    @Param("usageId") usageId: string,
    @Body() dto: ReturnAssetDto,
  ) {
    return this.service.returnAsset({
      organizationId: orgId,
      usageId,
      returnedAt: dto.returnedAt ? new Date(dto.returnedAt) : undefined,
      conditionIn: dto.conditionIn,
      notes: dto.notes,
    });
  }
}
