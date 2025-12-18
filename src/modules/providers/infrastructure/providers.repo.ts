import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class ProvidersRepo {
  constructor(private readonly prisma: PrismaService) {}

  // Providers (scoped a organización)
  createProvider(params: {
    organizationId: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) {
    return this.prisma.provider.create({
      data: {
        organizationId: params.organizationId,
        name: params.name,
        email: params.email ?? null,
        phone: params.phone ?? null,
        notes: params.notes ?? null,
      },
    });
  }

  listProviders(organizationId: string) {
    return this.prisma.provider.findMany({
      where: { organizationId },
      orderBy: [{ name: "asc" }],
    });
  }

  getProviderOrThrow(providerId: string, organizationId: string) {
    return this.prisma.provider.findFirstOrThrow({
      where: { id: providerId, organizationId },
    });
  }

  // ProviderService (scoped a evento)
  async assertEventInOrg(eventId: string, organizationId: string) {
    await this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
  }

  createProviderService(params: {
    organizationId: string;
    eventId: string;
    providerId: string;
    category: any;
    name: string;
    slaMinutes?: number;
    windowSlackMinutes?: number;
    notes?: string;
  }) {
    return this.prisma.providerService.create({
      data: {
        providerId: params.providerId,
        eventId: params.eventId,
        category: params.category,
        name: params.name,
        slaMinutes: params.slaMinutes ?? null,
        windowSlackMinutes: params.windowSlackMinutes ?? null,
        notes: params.notes ?? null,
      },
      include: { provider: true, event: true },
    });
  }

  listProviderServices(params: { organizationId: string; eventId: string }) {
    // filtra por evento, pero además garantizamos pertenencia del evento a la org en service
    return this.prisma.providerService.findMany({
      where: { eventId: params.eventId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { provider: true },
    });
  }
}
