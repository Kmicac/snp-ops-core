import { Injectable } from "@nestjs/common";
import { ProvidersRepo } from "../infrastructure/providers.repo";
import { ServiceCategory } from "@prisma/client";

@Injectable()
export class ProvidersService {
  constructor(private readonly repo: ProvidersRepo) {}

  createProvider(params: {
    organizationId: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
  }) {
    return this.repo.createProvider({
      organizationId: params.organizationId,
      name: params.name.trim(),
      email: params.email?.trim(),
      phone: params.phone?.trim(),
      notes: params.notes?.trim(),
    });
  }

  listProviders(organizationId: string) {
    return this.repo.listProviders(organizationId);
  }

  async createProviderService(params: {
    organizationId: string;
    eventId: string;
    providerId: string;
    category: ServiceCategory;
    name: string;
    slaMinutes?: number;
    windowSlackMinutes?: number;
    notes?: string;
  }) {
    // ✅ seguridad de dominio: el evento debe pertenecer a la organización
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    // ✅ provider debe pertenecer a la organización
    await this.repo.getProviderOrThrow(params.providerId, params.organizationId);

    return this.repo.createProviderService({
      organizationId: params.organizationId,
      eventId: params.eventId,
      providerId: params.providerId,
      category: params.category,
      name: params.name.trim(),
      slaMinutes: params.slaMinutes,
      windowSlackMinutes: params.windowSlackMinutes,
      notes: params.notes?.trim(),
    });
  }

  async listProviderServices(params: { organizationId: string; eventId: string }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    return this.repo.listProviderServices(params);
  }
}
