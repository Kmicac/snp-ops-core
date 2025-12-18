import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProvidersService } from "../application/providers.service";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { CreateProviderServiceDto } from "./dto/create-provider-service.dto";

@Controller()
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  // Providers
  @Post("/orgs/:orgId/providers")
  createProvider(@Param("orgId") orgId: string, @Body() dto: CreateProviderDto) {
    return this.service.createProvider({
      organizationId: orgId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      notes: dto.notes,
    });
  }

  @Get("/orgs/:orgId/providers")
  listProviders(@Param("orgId") orgId: string) {
    return this.service.listProviders(orgId);
  }

  // Provider Services (por evento)
  @Post("/orgs/:orgId/events/:eventId/providers/:providerId/services")
  createProviderService(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("providerId") providerId: string,
    @Body() dto: CreateProviderServiceDto,
  ) {
    return this.service.createProviderService({
      organizationId: orgId,
      eventId,
      providerId,
      category: dto.category,
      name: dto.name,
      slaMinutes: dto.slaMinutes,
      windowSlackMinutes: dto.windowSlackMinutes,
      notes: dto.notes,
    });
  }

  @Get("/orgs/:orgId/events/:eventId/services")
  listProviderServices(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listProviderServices({ organizationId: orgId, eventId });
  }
}
