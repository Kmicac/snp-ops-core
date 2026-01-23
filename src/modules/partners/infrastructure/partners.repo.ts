import { Injectable } from "@nestjs/common";
import {
  Brand,
  Partnership,
  PartnershipStatus,
  PartnerSponsorApplicationStatus,
  Sponsorship,
  SponsorshipStatus,
  SponsorshipTier,
} from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Injectable()
export class PartnersRepo {
  constructor(private readonly prisma: PrismaService) { }

  // ------- Brands -------

  createBrand(data: {
    organizationId: string;
    name: string;
    logoUrl?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
  }): Promise<Brand> {
    return this.prisma.brand.create({
      data,
    });
  }

  listBrands(organizationId: string): Promise<Brand[]> {
    return this.prisma.brand.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
  }

  // ------- Partnerships -------

  createPartnership(data: {
    organizationId: string;
    brandId: string;
    imageUrl?: string;
    status?: PartnershipStatus;
    scope?: string;
    benefits?: string;
    notes?: string;
  }): Promise<Partnership> {
    return this.prisma.partnership.create({
      data: {
        organizationId: data.organizationId,
        brandId: data.brandId,
        imageUrl: data.imageUrl,
        status: data.status ?? PartnershipStatus.PROSPECT,
        scope: data.scope,
        benefits: data.benefits,
        notes: data.notes,
      },
    });
  }

  listPartners(organizationId: string): Promise<(Partnership & { brand: Brand })[]> {
    return this.prisma.partnership.findMany({
      where: { organizationId, status: { in: [PartnershipStatus.PROSPECT, PartnershipStatus.ACTIVE] } },
      include: { brand: true },
      orderBy: { createdAt: "desc" },
    });
  }

  // ------- Sponsorships (Sponsors por evento) -------

  createSponsorship(data: {
    organizationId: string;
    eventId: string;
    brandId: string;
    tier: SponsorshipTier;
    status?: SponsorshipStatus;
    cashValue?: number;
    inKindValue?: number;
    benefits?: string;
    notes?: string;
  }): Promise<Sponsorship> {
    return this.prisma.sponsorship.create({
      data: {
        organizationId: data.organizationId,
        eventId: data.eventId,
        brandId: data.brandId,
        tier: data.tier,
        status: data.status ?? SponsorshipStatus.PROPOSED,
        cashValue: data.cashValue,
        inKindValue: data.inKindValue,
        benefits: data.benefits,
        notes: data.notes,
      },
    });
  }

  listSponsorsForEvent(eventId: string): Promise<(Sponsorship & { brand: Brand })[]> {
    return this.prisma.sponsorship.findMany({
      where: { eventId, status: SponsorshipStatus.CONFIRMED },
      include: { brand: true },
      orderBy: { tier: "asc" },
    });
  }

  // ------- Public applications -------

  createApplication(data: {
    organizationId: string;
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
    return this.prisma.partnerSponsorApplication.create({
      data,
    });
  }

  listApplications(organizationId: string, status?: PartnerSponsorApplicationStatus) {
    return this.prisma.partnerSponsorApplication.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  updateApplicationStatus(args: {
    applicationId: string;
    status: PartnerSponsorApplicationStatus;
    reviewedById?: string | null;
    reviewNotes?: string | null;
  }) {
    return this.prisma.partnerSponsorApplication.update({
      where: { id: args.applicationId },
      data: {
        status: args.status,
        reviewedById: args.reviewedById ?? null,
        reviewedAt: new Date(),
        reviewNotes: args.reviewNotes ?? null,
      },
    });
  }

  async listEventSponsorsWithBrand(eventId: string, organizationId: string) {
    return this.prisma.sponsorship.findMany({
      where: {
        eventId,
        organizationId,
        status: SponsorshipStatus.CONFIRMED,
      },
      include: {
        brand: true,
      },
      orderBy: [
        { tier: "asc" },
        { createdAt: "asc" },
      ],
    });
  }
}
