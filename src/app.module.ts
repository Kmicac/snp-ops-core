import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaService } from './shared/prisma/prisma.service';
import { validateEnv } from "./config/env";
import { EventsModule } from "./modules/events/events.module";
import { ProvidersModule } from "./modules/providers/providers.module";
import { WorkOrdersModule } from "./modules/work-orders/work-orders.module";
import { StaffModule } from "./modules/staff/staff.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { KpisModule } from "./modules/kpis/kpis.module";
import { ImprovementsModule } from "./modules/improvements/improvements.module";

import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGlobalGuard } from "./modules/auth/security/jwt-auth-global.guard";
import { RolesGuard } from "./modules/auth/security/roles.guard";
import { PartnersModule } from "./modules/partners/partners.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { RefereesModule } from "./modules/referees/referees.module";
import { TrainingsModule } from "./modules/trainings/trainings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (raw) => validateEnv(raw),
    }),

    AuthModule,
    EventsModule,
    ProvidersModule,
    WorkOrdersModule,
    StaffModule,
    AuditModule,
    KpisModule,
    ImprovementsModule,
    PartnersModule,
    InventoryModule,
    RefereesModule,
    TrainingsModule,
  ],
  providers: [PrismaService,
    { provide: APP_GUARD, useClass: JwtAuthGlobalGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
