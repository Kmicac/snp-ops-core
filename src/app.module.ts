import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './shared/prisma/prisma.service';
import { EventsModule } from './modules/events/events.module';
import { ProvidersModule } from "./modules/providers/providers.module";


@Module({
  imports: [
  ConfigModule.forRoot({ isGlobal: true }),
  EventsModule,
  ProvidersModule,
],
  providers: [PrismaService],
})
export class AppModule {}
