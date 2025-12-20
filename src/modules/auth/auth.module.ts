import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuthController } from "./api/auth.controller";
import { AuthService } from "./application/auth.service";
import { AuthRepo } from "./infrastructure/auth.repo";
import { JwtStrategy } from "./security/jwt.strategy";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev_secret_change_me",
      signOptions: { expiresIn: "12h" },
    }),
  ],
  controllers: [AuthController],
  providers: [PrismaService, AuthService, AuthRepo, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
