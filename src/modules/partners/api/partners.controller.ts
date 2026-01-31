import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UploadedFile,
    UseInterceptors,
} from "@nestjs/common";
import { Request } from "express";
import {
    OrgRole,
    PartnerSponsorApplicationStatus,
} from "@prisma/client";
import { PartnersService } from "../application/partners.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { CreateSponsorshipDto } from "./dto/create-sponsorship.dto";
import { CreatePartnerSponsorApplicationDto } from "./dto/create-application.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";
import { Roles } from "../../auth/security/roles.decorator";
import { Public } from "../../auth/security/public.decorator";
import { CreatePartnershipDto } from "./dto/create-partnersihp.dto";
import { FileInterceptor } from "@nestjs/platform-express";

type AuthenticatedRequest = Request & { user?: { sub?: string } };

@Controller()
export class PartnersController {
    constructor(private readonly service: PartnersService) { }


    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Post("orgs/:orgId/brands")
    createBrand(@Param("orgId") orgId: string, @Body() dto: CreateBrandDto) {
        return this.service.createBrand(orgId, dto);
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Get("orgs/:orgId/brands")
    listBrands(@Param("orgId") orgId: string) {
        return this.service.listBrands(orgId);
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Post("orgs/:orgId/partners")
    createPartnership(
        @Param("orgId") orgId: string,
        @Body() dto: CreatePartnershipDto,
    ) {
        return this.service.createPartnership(orgId, dto);
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA,)
    @Get("orgs/:orgId/partners")
    listPartners(@Param("orgId") orgId: string) {
        return this.service.listPartners(orgId);
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Post("orgs/:orgId/events/:eventId/sponsors")
    createSponsorship(
        @Param("orgId") orgId: string,
        @Param("eventId") eventId: string,
        @Body() dto: CreateSponsorshipDto,
    ) {
        return this.service.createSponsorship(orgId, eventId, dto);
    }

    @Get("orgs/:orgId/events/:eventId/sponsors")
    listSponsorsForEvent(@Param("eventId") eventId: string) {
        return this.service.listSponsorsForEvent(eventId);
    }

    @Public()
    @Get("public/orgs/:orgId/brands")
    publicListBrands(@Param("orgId") orgId: string) {
        return this.service.listBrands(orgId);
    }

    @Public()
    @Get("public/orgs/:orgId/events/:eventId/sponsors")
    publicListSponsors(@Param("eventId") eventId: string) {
        return this.service.listSponsorsForEvent(eventId);
    }

    @Public()
    @Post("public/orgs/:orgId/partner-sponsor-applications")
    publicCreateApplication(
        @Param("orgId") orgId: string,
        @Body() dto: CreatePartnerSponsorApplicationDto,
    ) {
        return this.service.createApplication(orgId, dto);
    }


    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.HR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Get("orgs/:orgId/partner-sponsor-applications")
    listApplications(
        @Param("orgId") orgId: string,
        @Query("status") status?: PartnerSponsorApplicationStatus,
    ) {
        return this.service.listApplications(orgId, status);
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.HR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Patch("orgs/:orgId/partner-sponsor-applications/:applicationId/status")
    updateApplicationStatus(
        @Param("applicationId") applicationId: string,
        @Body() dto: UpdateApplicationStatusDto,
        @Req() req: AuthenticatedRequest
    ) {
        const user = req.user as any;
        const userId = user?.sub ?? null;

        return this.service.updateApplicationStatus({
            applicationId,
            status: dto.status,
            reviewedById: userId,
            reviewNotes: dto.reviewNotes ?? null,
        });
    }

    @Public()
    @Get("public/orgs/:orgId/events/:eventId/sponsors-by-tier")
    getEventSponsorsByTier(
        @Param("orgId") orgId: string,
        @Param("eventId") eventId: string,
    ) {
        return this.service.getEventSponsorsByTier(orgId, eventId);
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Get("orgs/:orgId/events/:eventId/sponsors/kpis")
    getEventSponsorKpis(
        @Param("orgId") orgId: string,
        @Param("eventId") eventId: string,
    ) {
        return this.service.getEventSponsorKpis(orgId, eventId);
    }

    @Public()
    @Get("public/orgs/:orgId/partners")
    getPublicPartners(@Param("orgId") orgId: string) {
        return this.service.getPublicPartners(orgId);
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Post("orgs/:orgId/brands/:brandId/logo")
    @UseInterceptors(
        FileInterceptor("file", {
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    async uploadBrandLogo(
        @Param("orgId") orgId: string,
        @Param("brandId") brandId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.service.uploadBrandLogo({
            organizationId: orgId,
            brandId,
            file,
        });
    }

    @Roles(OrgRole.SUPER_ADMIN, OrgRole.EVENT_DIRECTOR, OrgRole.TECH_SYSTEMS, OrgRole.GUADA)
    @Post("orgs/:orgId/events/:eventId/sponsors/:sponsorshipId/image")
    @UseInterceptors(
        FileInterceptor("file", {
            limits: { fileSize: 5 * 1024 * 1024 },
        }),
    )
    async uploadSponsorshipImage(
        @Param("orgId") orgId: string,
        @Param("eventId") eventId: string,
        @Param("sponsorshipId") sponsorshipId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.service.uploadSponsorshipImage({
            organizationId: orgId,
            eventId,
            sponsorshipId,
            file,
        });
    }
}
