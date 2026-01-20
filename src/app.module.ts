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

import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGlobalGuard } from "./modules/auth/security/jwt-auth-global.guard";
import { RolesGuard } from "./modules/auth/security/roles.guard";

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
  ],
  providers: [PrismaService,
    { provide: APP_GUARD, useClass: JwtAuthGlobalGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
