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

  async getEventSponsorStats(eventId: string, organizationId: string) {
    const whereBase = {
      eventId,
      organizationId,
      status: SponsorshipStatus.CONFIRMED,
    } as const;

    const totals = await this.prisma.sponsorship.aggregate({
      where: whereBase,
      _sum: {
        cashValue: true,
        inKindValue: true,
      },
      _count: true,
    });

    const byTier = await this.prisma.sponsorship.groupBy({
      by: ["tier"],
      where: whereBase,
      _sum: {
        cashValue: true,
        inKindValue: true,
      },
      _count: true,
    });

    return { totals, byTier };
  }

  async listPublicPartners(organizationId: string) {
    // Para la web pública, mostramos sólo ACTIVE
    return this.prisma.partnership.findMany({
      where: {
        organizationId,
        status: PartnershipStatus.ACTIVE,
      },
      include: {
        brand: true,
      },
      orderBy: [
        { createdAt: "asc" },
      ],
    });
  }

  async getBrandOrThrow(organizationId: string, brandId: string) {
    return this.prisma.brand.findFirstOrThrow({
      where: {
        id: brandId,
        organizationId,
      },
    });
  }

  async updateBrandLogo(
    organizationId: string,
    brandId: string,
    logoUrl: string,
  ) {
    return this.prisma.brand.update({
      where: { id: brandId },
      data: {
        logoUrl,
        updatedAt: new Date(),
      },
    });
  }

  async getSponsorshipOrThrow(params: {
    organizationId: string;
    eventId: string;
    sponsorshipId: string;
  }) {
    const { organizationId, eventId, sponsorshipId } = params;
    return this.prisma.sponsorship.findFirstOrThrow({
      where: {
        id: sponsorshipId,
        organizationId,
        eventId,
      },
    });
  }

  async updateSponsorshipImage(params: {
    organizationId: string;
    eventId: string;
    sponsorshipId: string;
    imageUrl: string;
  }) {
    const { sponsorshipId, imageUrl } = params;
    return this.prisma.sponsorship.update({
      where: { id: sponsorshipId },
      data: {
        imageUrl,
        updatedAt: new Date(),
      },
    });
  }
}
