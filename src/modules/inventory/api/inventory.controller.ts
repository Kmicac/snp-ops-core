import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import {
  AssetStatus,
  OrgRole,
} from "@prisma/client";
import type { Response } from "express";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { InventoryReportsService } from "../application/inventory-reports.service";
import { InventoryService } from "../application/inventory.service";
import { CheckoutAssetDto } from "./dto/checkout-asset.dto";
import { CreateAssetCategoryDto } from "./dto/create-asset-category.dto";
import { CreateAssetDto } from "./dto/create-asset.dto";
import { CreateInventoryChecklistDto } from "./dto/create-inventory-checklist.dto";
import { CreateInventoryKitDto } from "./dto/create-inventory-kit.dto";
import { ExportMovementsReportQueryDto } from "./dto/export-movements-report-query.dto";
import { InventoryDashboardQueryDto } from "./dto/inventory-dashboard-query.dto";
import { ListChecklistsQueryDto } from "./dto/list-checklists-query.dto";
import { ListMovementsQueryDto } from "./dto/list-movements-query.dto";
import { ReturnAssetDto } from "./dto/return-asset.dto";
import { SignChecklistDto } from "./dto/sign-checklist.dto";
import { UpdateAssetCategoryDto } from "./dto/update-asset-category.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";
import { UpdateInventoryKitDto } from "./dto/update-inventory-kit.dto";
import { VerifyChecklistItemDto } from "./dto/verify-checklist-item.dto";

const MANAGE_ROLES = [
  OrgRole.SUPER_ADMIN,
  OrgRole.EVENT_DIRECTOR,
  OrgRole.TECH_SYSTEMS,
  OrgRole.GUADA,
] as const;

const READ_ROLES = [
  OrgRole.SUPER_ADMIN,
  OrgRole.HR,
  OrgRole.EVENT_DIRECTOR,
  OrgRole.HEAD_REFEREE,
  OrgRole.TECH_SYSTEMS,
  OrgRole.GUADA,
] as const;

@Controller()
export class InventoryController {
  constructor(
    private readonly service: InventoryService,
    private readonly reports: InventoryReportsService,
  ) {}

  private actorFromRequest(req: any) {
    const userAgent = req.headers["user-agent"];

    return {
      userId: req.user?.sub ?? null,
      ip: req.ip ?? null,
      userAgent: typeof userAgent === "string" ? userAgent : null,
    };
  }

  @Roles(...MANAGE_ROLES)
  @Post("orgs/:orgId/asset-categories")
  createCategory(
    @Param("orgId") orgId: string,
    @Body() dto: CreateAssetCategoryDto,
  ) {
    return this.service.createCategory(orgId, dto);
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/asset-categories")
  listCategories(@Param("orgId") orgId: string) {
    return this.service.listCategories(orgId);
  }

  @Roles(...MANAGE_ROLES)
  @Patch("orgs/:orgId/asset-categories/:categoryId")
  updateCategory(
    @Param("orgId") orgId: string,
    @Param("categoryId") categoryId: string,
    @Body() dto: UpdateAssetCategoryDto,
  ) {
    return this.service.updateCategory(orgId, categoryId, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Post("orgs/:orgId/assets")
  createAsset(
    @Param("orgId") orgId: string,
    @Body() dto: CreateAssetDto,
    @Req() req: any,
  ) {
    return this.service.createAsset(
      orgId,
      {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
      this.actorFromRequest(req),
    );
  }

  @Roles(...READ_ROLES)
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

  @Roles(...MANAGE_ROLES)
  @Patch("orgs/:orgId/assets/:assetId")
  updateAsset(
    @Param("orgId") orgId: string,
    @Param("assetId") assetId: string,
    @Body() dto: UpdateAssetDto,
    @Req() req: any,
  ) {
    return this.service.updateAsset(
      orgId,
      assetId,
      {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
      this.actorFromRequest(req),
    );
  }

  @Roles(...MANAGE_ROLES)
  @Delete("orgs/:orgId/assets/:assetId")
  @HttpCode(204)
  async deleteAsset(
    @Param("orgId") orgId: string,
    @Param("assetId") assetId: string,
    @Req() req: any,
  ) {
    await this.service.deleteAsset(orgId, assetId, this.actorFromRequest(req));
  }

  @Roles(...MANAGE_ROLES)
  @Post("orgs/:orgId/events/:eventId/assets/:assetId/checkout")
  checkoutAsset(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("assetId") assetId: string,
    @Body() dto: CheckoutAssetDto,
    @Req() req: any,
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
      ...this.actorFromRequest(req),
    });
  }

  @Roles(...MANAGE_ROLES)
  @Post("orgs/:orgId/events/:eventId/assets-usage/:usageId/return")
  returnAsset(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("usageId") usageId: string,
    @Body() dto: ReturnAssetDto,
    @Req() req: any,
  ) {
    return this.service.returnAsset({
      organizationId: orgId,
      usageId,
      eventId,
      returnedAt: dto.returnedAt ? new Date(dto.returnedAt) : undefined,
      conditionIn: dto.conditionIn,
      notes: dto.notes,
      ...this.actorFromRequest(req),
    });
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/movements")
  listMovements(
    @Param("orgId") orgId: string,
    @Query() query: ListMovementsQueryDto,
  ) {
    return this.service.listMovements({
      organizationId: orgId,
      assetId: query.assetId,
      eventId: query.eventId,
      movementType: query.movementType,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/kits")
  listKits(@Param("orgId") orgId: string) {
    return this.service.listKits(orgId);
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/kits/:kitId")
  getKit(
    @Param("orgId") orgId: string,
    @Param("kitId") kitId: string,
  ) {
    return this.service.getKit(orgId, kitId);
  }

  @Roles(...MANAGE_ROLES)
  @Post("orgs/:orgId/inventory/kits")
  createKit(
    @Param("orgId") orgId: string,
    @Body() dto: CreateInventoryKitDto,
    @Req() req: any,
  ) {
    return this.service.createKit(orgId, dto, this.actorFromRequest(req));
  }

  @Roles(...MANAGE_ROLES)
  @Patch("orgs/:orgId/inventory/kits/:kitId")
  updateKit(
    @Param("orgId") orgId: string,
    @Param("kitId") kitId: string,
    @Body() dto: UpdateInventoryKitDto,
    @Req() req: any,
  ) {
    return this.service.updateKit(orgId, kitId, dto, this.actorFromRequest(req));
  }

  @Roles(...MANAGE_ROLES)
  @Delete("orgs/:orgId/inventory/kits/:kitId")
  deleteKit(
    @Param("orgId") orgId: string,
    @Param("kitId") kitId: string,
    @Req() req: any,
  ) {
    return this.service.deleteKit(orgId, kitId, this.actorFromRequest(req));
  }

  @Roles(...MANAGE_ROLES)
  @Post("orgs/:orgId/events/:eventId/inventory/apply-kit/:kitId")
  applyKitToEvent(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("kitId") kitId: string,
    @Req() req: any,
  ) {
    return this.service.applyKitToEvent({
      organizationId: orgId,
      eventId,
      kitId,
      ...this.actorFromRequest(req),
    });
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/checklists")
  listChecklists(
    @Param("orgId") orgId: string,
    @Query() query: ListChecklistsQueryDto,
  ) {
    return this.service.listChecklists({
      organizationId: orgId,
      eventId: query.eventId,
      status: query.status,
      limit: query.limit,
      offset: query.offset,
    });
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/checklists/:checklistId")
  getChecklist(
    @Param("orgId") orgId: string,
    @Param("checklistId") checklistId: string,
  ) {
    return this.service.getChecklist(orgId, checklistId);
  }

  @Roles(...MANAGE_ROLES)
  @Post("orgs/:orgId/inventory/checklists")
  createChecklist(
    @Param("orgId") orgId: string,
    @Body() dto: CreateInventoryChecklistDto,
    @Req() req: any,
  ) {
    return this.service.createChecklist({
      organizationId: orgId,
      eventId: dto.eventId,
      checklistType: dto.checklistType,
      responsibleName: dto.responsibleName,
      notes: dto.notes,
      ...this.actorFromRequest(req),
    });
  }

  @Roles(...MANAGE_ROLES)
  @Put("orgs/:orgId/inventory/checklists/:checklistId/verify-item")
  verifyChecklistItem(
    @Param("orgId") orgId: string,
    @Param("checklistId") checklistId: string,
    @Body() dto: VerifyChecklistItemDto,
    @Req() req: any,
  ) {
    return this.service.verifyChecklistItem({
      organizationId: orgId,
      checklistId,
      assetId: dto.assetId,
      verified: dto.verified,
      quantityVerified: dto.quantityVerified,
      verifiedBy: dto.verifiedBy,
      condition: dto.condition,
      notes: dto.notes,
      ...this.actorFromRequest(req),
    });
  }

  @Roles(...MANAGE_ROLES)
  @Put("orgs/:orgId/inventory/checklists/:checklistId/sign")
  signChecklist(
    @Param("orgId") orgId: string,
    @Param("checklistId") checklistId: string,
    @Body() dto: SignChecklistDto,
    @Req() req: any,
  ) {
    return this.service.signChecklist({
      organizationId: orgId,
      checklistId,
      signedBy: dto.signedBy,
      signatureData: dto.signatureData,
      ...this.actorFromRequest(req),
    });
  }

  @Roles(...MANAGE_ROLES)
  @Delete("orgs/:orgId/inventory/checklists/:checklistId")
  deleteChecklist(
    @Param("orgId") orgId: string,
    @Param("checklistId") checklistId: string,
    @Req() req: any,
  ) {
    return this.service.deleteChecklist(orgId, checklistId, this.actorFromRequest(req));
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/dashboard/stats")
  dashboardStats(
    @Param("orgId") orgId: string,
    @Query() query: InventoryDashboardQueryDto,
  ) {
    return this.service.getDashboardStats({
      organizationId: orgId,
      eventId: query.eventId,
    });
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/reports/movements/export")
  async exportMovements(
    @Param("orgId") orgId: string,
    @Query() query: ExportMovementsReportQueryDto,
    @Res() res: Response,
  ) {
    const file = await this.reports.exportMovementsExcel({
      organizationId: orgId,
      assetId: query.assetId,
      eventId: query.eventId,
      movementType: query.movementType,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="inventory-movements.xlsx"',
    );

    res.send(file);
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/reports/checklists/:checklistId/export-pdf")
  async exportChecklistPdf(
    @Param("orgId") orgId: string,
    @Param("checklistId") checklistId: string,
    @Res() res: Response,
  ) {
    const file = await this.reports.exportChecklistPdf({
      organizationId: orgId,
      checklistId,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="checklist-${checklistId}.pdf"`,
    );

    res.send(file);
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/assets/:assetId/qr")
  getAssetQr(
    @Param("orgId") orgId: string,
    @Param("assetId") assetId: string,
  ) {
    return this.service.getAssetQr(orgId, assetId);
  }

  @Roles(...READ_ROLES)
  @Get("orgs/:orgId/inventory/scan/:qrData")
  scanQrData(
    @Param("orgId") orgId: string,
    @Param("qrData") qrData: string,
  ) {
    return this.service.scanQrData(orgId, decodeURIComponent(qrData));
  }
}
