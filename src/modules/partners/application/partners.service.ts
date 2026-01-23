import { Injectable } from "@nestjs/common";
import {
    PartnerSponsorApplicationStatus,
    SponsorshipTier,
} from "@prisma/client";
import { PartnersRepo } from "../infrastructure/partners.repo";

@Injectable()
export class PartnersService {
    constructor(private readonly repo: PartnersRepo) { }

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

    listSponsorsForEvent(eventId: string) {
        return this.repo.listSponsorsForEvent(eventId);
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

    async getEventSponsorsByTier(organizationId: string, eventId: string) {
        const sponsors = await this.repo.listEventSponsorsWithBrand(
            eventId,
            organizationId,
        );

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
}
