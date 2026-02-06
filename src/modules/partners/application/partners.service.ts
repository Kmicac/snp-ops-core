import { Injectable } from "@nestjs/common";
import {
    AuditActionType,
    AuditEntityType,
    PartnerSponsorApplicationStatus,
    PartnershipStatus,
    SponsorshipStatus,
    SponsorshipTier,
} from "@prisma/client";
import { PartnersRepo } from "../infrastructure/partners.repo";
import { FilesService } from "src/modules/files/files.service";
import { AuditService } from "src/modules/audit/application/audit.service";

@Injectable()
export class PartnersService {
    constructor(
        private readonly repo: PartnersRepo,
        private readonly files: FilesService,
        private readonly audit: AuditService,
    ) { }

    createBrand(organizationId: string, data: {
        name: string;
        logoUrl?: string;
        websiteUrl?: string;
        instagramUrl?: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
        notes?: string;
    }) {
        return this.repo.createBrand({ organizationId, ...data });
    }

    listBrands(organizationId: string) {
        return this.repo.listBrands(organizationId);
    }

    async updateBrand(organizationId: string, brandId: string, data: {
        name?: string;
        logoUrl?: string | null;
        websiteUrl?: string | null;
        instagramUrl?: string | null;
        contactName?: string | null;
        contactEmail?: string | null;
        contactPhone?: string | null;
        notes?: string | null;
    }) {
        await this.repo.getBrandOrThrow(organizationId, brandId);

        const patch: Record<string, any> = {};
        if (data.name !== undefined) patch.name = data.name.trim();
        if (data.logoUrl !== undefined) patch.logoUrl = data.logoUrl?.trim() ?? null;
        if (data.websiteUrl !== undefined) patch.websiteUrl = data.websiteUrl?.trim() ?? null;
        if (data.instagramUrl !== undefined) patch.instagramUrl = data.instagramUrl?.trim() ?? null;
        if (data.contactName !== undefined) patch.contactName = data.contactName?.trim() ?? null;
        if (data.contactEmail !== undefined) patch.contactEmail = data.contactEmail?.trim() ?? null;
        if (data.contactPhone !== undefined) patch.contactPhone = data.contactPhone?.trim() ?? null;
        if (data.notes !== undefined) patch.notes = data.notes?.trim() ?? null;

        return this.repo.updateBrand({ brandId, data: patch });
    }

    createPartnership(organizationId: string, data: {
        brandId: string;
        imageUrl?: string;
        scope?: string;
        benefits?: string;
        notes?: string;
    }) {
        return this.repo.createPartnership({
            organizationId,
            brandId: data.brandId,
            imageUrl: data.imageUrl,
            scope: data.scope,
            benefits: data.benefits,
            notes: data.notes,
        });
    }

    listPartners(organizationId: string) {
        return this.repo.listPartners(organizationId);
    }

    async updatePartnership(organizationId: string, partnershipId: string, data: {
        brandId?: string;
        imageUrl?: string | null;
        status?: PartnershipStatus;
        startDate?: string | null;
        endDate?: string | null;
        scope?: string | null;
        benefits?: string | null;
        notes?: string | null;
    }) {
        await this.repo.getPartnershipOrThrow({ organizationId, partnershipId });

        if (data.brandId !== undefined) {
            await this.repo.getBrandOrThrow(organizationId, data.brandId);
        }

        const patch: Record<string, any> = {};
        if (data.brandId !== undefined) patch.brandId = data.brandId;
        if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl?.trim() ?? null;
        if (data.status !== undefined) patch.status = data.status;
        if (data.startDate !== undefined) patch.startDate = data.startDate ? new Date(data.startDate) : null;
        if (data.endDate !== undefined) patch.endDate = data.endDate ? new Date(data.endDate) : null;
        if (data.scope !== undefined) patch.scope = data.scope?.trim() ?? null;
        if (data.benefits !== undefined) patch.benefits = data.benefits?.trim() ?? null;
        if (data.notes !== undefined) patch.notes = data.notes?.trim() ?? null;

        return this.repo.updatePartnership({ partnershipId, data: patch });
    }

    createSponsorship(organizationId: string, eventId: string, data: {
        brandId: string;
        tier: SponsorshipTier;
        cashValue?: number;
        inKindValue?: number;
        benefits?: string;
        notes?: string;
    }) {
        return this.repo.createSponsorship({
            organizationId,
            eventId,
            ...data,
        });
    }

    listSponsorsForEvent(params: {
        organizationId: string;
        eventId: string;
        onlyConfirmed?: boolean;
    }) {
        return this.repo.listSponsorsForEvent(params);
    }

    createApplication(organizationId: string, data: {
        companyName: string;
        contactName: string;
        email: string;
        phone?: string;
        websiteUrl?: string;
        instagramUrl?: string;
        wantsPartner: boolean;
        wantsSponsor: boolean;
        preferredEventId?: string;
        message?: string;
    }) {
        return this.repo.createApplication({
            organizationId,
            ...data,
        });
    }

    listApplications(organizationId: string, status?: PartnerSponsorApplicationStatus) {
        return this.repo.listApplications(organizationId, status);
    }

    updateApplicationStatus(args: {
        applicationId: string;
        status: PartnerSponsorApplicationStatus;
        reviewedById?: string | null;
        reviewNotes?: string | null;
    }) {
        return this.repo.updateApplicationStatus(args);
    }

    async updateSponsorshipStatus(args: {
        organizationId: string;
        eventId: string;
        sponsorshipId: string;
        status: SponsorshipStatus;
        notes?: string;
    }) {
        const current = await this.repo.getSponsorshipOrThrow({
            organizationId: args.organizationId,
            eventId: args.eventId,
            sponsorshipId: args.sponsorshipId,
        });

        const updated = await this.repo.updateSponsorshipStatus(args);

        if (current.status !== updated.status) {
            await this.audit.log({
                organizationId: args.organizationId,
                eventId: args.eventId,
                entityType: AuditEntityType.SPONSORSHIP,
                entityId: updated.id,
                action: AuditActionType.STATUS_CHANGED,
                message: `Sponsorship status changed from ${current.status} to ${updated.status}`,
                changes: {
                    fromStatus: current.status,
                    toStatus: updated.status,
                },
            });
        }

        return updated;
    }

    async updateSponsorship(args: {
        organizationId: string;
        eventId: string;
        sponsorshipId: string;
        data: {
            brandId?: string;
            imageUrl?: string | null;
            tier?: SponsorshipTier;
            cashValue?: number | null;
            inKindValue?: number | null;
            benefits?: string | null;
            notes?: string | null;
        };
        performedByUserId?: string | null;
    }) {
        await this.repo.getSponsorshipOrThrow({
            organizationId: args.organizationId,
            eventId: args.eventId,
            sponsorshipId: args.sponsorshipId,
        });

        if (args.data.brandId !== undefined) {
            await this.repo.getBrandOrThrow(args.organizationId, args.data.brandId);
        }

        const patch: Record<string, any> = {};
        if (args.data.brandId !== undefined) patch.brandId = args.data.brandId;
        if (args.data.imageUrl !== undefined) patch.imageUrl = args.data.imageUrl?.trim() ?? null;
        if (args.data.tier !== undefined) patch.tier = args.data.tier;
        if (args.data.cashValue !== undefined) patch.cashValue = args.data.cashValue ?? null;
        if (args.data.inKindValue !== undefined) patch.inKindValue = args.data.inKindValue ?? null;
        if (args.data.benefits !== undefined) patch.benefits = args.data.benefits?.trim() ?? null;
        if (args.data.notes !== undefined) patch.notes = args.data.notes?.trim() ?? null;

        const updated = await this.repo.updateSponsorship({
            sponsorshipId: args.sponsorshipId,
            data: patch,
        });

        await this.audit.log({
            organizationId: args.organizationId,
            eventId: args.eventId,
            userId: args.performedByUserId ?? null,
            entityType: AuditEntityType.SPONSORSHIP,
            entityId: updated.id,
            action: AuditActionType.UPDATED,
            message: "Sponsorship updated",
            changes: patch,
        });

        return updated;
    }

    async getEventSponsorsByTier(organizationId: string, eventId: string) {
        const sponsors = await this.listSponsorsForEvent({
            organizationId,
            eventId,
            onlyConfirmed: true,
        });

        const byTier: Record<
            SponsorshipTier,
            {
                tier: SponsorshipTier;
                sponsors: Array<{
                    id: string;
                    brandName: string;
                    imageUrl: string | null;
                    logoUrl: string | null;
                    cashValue: number | null;
                    inKindValue: number | null;
                    benefits: string | null;
                    notes: string | null;
                    links: {
                        instagram: string | null;
                        website: string | null;
                    };
                }>;
            }
        > = {} as any;

        for (const s of sponsors) {
            const tier = s.tier as SponsorshipTier;
            if (!byTier[tier]) {
                byTier[tier] = { tier, sponsors: [] };
            }
            byTier[tier].sponsors.push({
                id: s.id,
                brandName: s.brand.name,
                imageUrl: s.imageUrl,
                logoUrl: s.brand.logoUrl,
                cashValue: s.cashValue,
                inKindValue: s.inKindValue,
                benefits: s.benefits,
                notes: s.notes,
                links: {
                    instagram: s.brand.instagramUrl,
                    website: s.brand.websiteUrl,
                },

            });
        }

        const tierOrder: SponsorshipTier[] = [
            SponsorshipTier.TITLE,
            SponsorshipTier.GOLD,
            SponsorshipTier.SILVER,
            SponsorshipTier.BRONZE,
            SponsorshipTier.SUPPORT,
        ];

        return tierOrder
            .filter((t) => byTier[t])
            .map((t) => byTier[t]);
    }

    async getEventSponsorKpis(organizationId: string, eventId: string) {
        const { totals, byTier } = await this.repo.getEventSponsorStats(
            eventId,
            organizationId,
        );

        return {
            totalSponsors: totals._count,
            totalCashValue: totals._sum.cashValue ?? 0,
            totalInKindValue: totals._sum.inKindValue ?? 0,
            byTier: byTier.map((t) => ({
                tier: t.tier,
                count: t._count,
                cashValue: t._sum.cashValue ?? 0,
                inKindValue: t._sum.inKindValue ?? 0,
            })),
        };
    }

    async getPublicPartners(organizationId: string) {
        const partners = await this.repo.listPublicPartners(organizationId);

        return partners.map((p) => ({
            id: p.id,
            brandId: p.brandId,
            brandName: p.brand.name,
            brandLogoUrl: p.brand.logoUrl,
            imageUrl: p.imageUrl,
            status: p.status,
            scope: p.scope,
            benefits: p.benefits,
            links: {
                instagram: p.brand.instagramUrl,
                website: p.brand.websiteUrl,
            },
        }));
    }

    async uploadBrandLogo(params: {
        organizationId: string;
        brandId: string;
        file: Express.Multer.File;
    }) {
        const { organizationId, brandId, file } = params;

        const brand = await this.repo.getBrandOrThrow(organizationId, brandId);

        const uploaded = await this.files.uploadPublicFile({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
            folder: `orgs/${organizationId}/brands/${brandId}`,
        });

        const updated = await this.repo.updateBrandLogo(
            organizationId,
            brandId,
            uploaded.url,
        );

        return updated;
    }

    async uploadSponsorshipImage(params: {
        organizationId: string;
        eventId: string;
        sponsorshipId: string;
        file: Express.Multer.File;
    }) {
        const { organizationId, eventId, sponsorshipId, file } = params;

        const sponsorship = await this.repo.getSponsorshipOrThrow({
            organizationId,
            eventId,
            sponsorshipId,
        });

        const uploaded = await this.files.uploadPublicFile({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
            folder: `orgs/${organizationId}/events/${eventId}/sponsors/${sponsorshipId}`,
        });

        const updated = await this.repo.updateSponsorshipImage({
            organizationId,
            eventId,
            sponsorshipId,
            imageUrl: uploaded.url,
        });

        return updated;
    }
}
