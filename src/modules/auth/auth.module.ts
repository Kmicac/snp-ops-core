import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuthController } from "./api/auth.controller";
import { AuthService } from "./application/auth.service";
import { AuthRepo } from "./infrastructure/auth.repo";
import { JwtStrategy } from "./security/jwt.strategy";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGlobalGuard } from "../auth/security/jwt-auth-global.guard";
import { RolesGuard } from "../auth/security/roles.guard";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev_secret_change_me",
      signOptions: { expiresIn: "12h" },
    }),
  ],
  controllers: [AuthController],
  providers: [PrismaService, AuthService, AuthRepo, JwtStrategy, { provide: APP_GUARD, useClass: JwtAuthGlobalGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
],
  exports: [JwtModule],
})
export class AuthModule {}
