import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuthController } from "./api/auth.controller";
import { AuthService } from "./application/auth.service";
import { AuthRepo } from "./infrastructure/auth.repo";
import { JwtStrategy } from "./security/jwt.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AppEnv } from "../../config/env";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppEnv>) => ({
        secret: config.get("JWT_SECRET", { infer: true }),
        signOptions: { expiresIn: config.get("JWT_EXPIRES_IN", { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [PrismaService, AuthService, AuthRepo, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
