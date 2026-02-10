import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { EventsController } from './api/events.controller';
import { EventsService } from './application/events.service';
import { EventsRepo } from './infrastructure/events.repo';
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule],
  controllers: [EventsController],
  providers: [PrismaService, EventsService, EventsRepo],
})
export class EventsModule {}
