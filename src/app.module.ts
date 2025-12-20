import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './shared/prisma/prisma.service';
import { EventsModule } from './modules/events/events.module';
import { ProvidersModule } from "./modules/providers/providers.module";
import { WorkOrdersModule } from "./modules/work-orders/work-orders.module";
import { KpisModule } from "./modules/kpis/kpis.module";
import { AuthModule } from "./modules/auth/auth.module";




@Module({
  imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  EventsModule,
  ProvidersModule,
  WorkOrdersModule,
  KpisModule,
  AuthModule
],
  providers: [PrismaService],
})
export class AppModule {}
