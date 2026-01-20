import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../security/jwt-auth.guard";
import { AuthService } from "../application/auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { Roles } from "../security/roles.decorator";
import { OrgRole } from "@prisma/client";
import { Public } from "../security/public.decorator";

@Controller()
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Roles(OrgRole.SUPER_ADMIN)
  @Post("/orgs/:orgId/auth/register")
  register(@Param("orgId") orgId: string, @Body() dto: RegisterDto) {
    return this.service.register({
      orgId,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
    });
  }

  @Public()
  @Post("/auth/login")
  login(@Body() dto: LoginDto) {
    return this.service.login({ email: dto.email, password: dto.password });
  }

  @UseGuards(JwtAuthGuard)
  @Get("/auth/me")
  me(@Req() req: any) {
    return this.service.me(req.user.sub);
  }
}
