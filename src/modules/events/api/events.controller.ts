import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EventsService } from '../application/events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateZoneDto } from './dto/create-zone.dto';

// Por ahora hardcodeamos orgId en un "const" (luego entra Auth + org scoping real)
const ORG_ID_PLACEHOLDER = 'ORG_PLACEHOLDER';

@Controller()
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Post('/orgs/:orgId/events')
  createEvent(@Param('orgId') orgId: string, @Body() dto: CreateEventDto) {
    return this.service.createEvent({
      organizationId: orgId,
      code: dto.code,
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      venueId: dto.venueId,
    });
  }

  @Get('/orgs/:orgId/events')
  listEvents(@Param('orgId') orgId: string) {
    return this.service.listEvents(orgId);
  }

  @Get('/orgs/:orgId/events/:eventId')
  getEvent(@Param('orgId') orgId: string, @Param('eventId') eventId: string) {
    return this.service.getEvent(orgId, eventId);
  }

  @Post('/orgs/:orgId/events/:eventId/zones')
  createZone(
    @Param('orgId') orgId: string,
    @Param('eventId') eventId: string,
    @Body() dto: CreateZoneDto,
  ) {
    return this.service.createZone({
      organizationId: orgId,
      eventId,
      name: dto.name,
      type: dto.type,
    });
  }

  @Get('/orgs/:orgId/events/:eventId/zones')
  listZones(@Param('orgId') orgId: string, @Param('eventId') eventId: string) {
    return this.service.listZones({ organizationId: orgId, eventId });
  }
}
