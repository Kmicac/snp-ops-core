import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../security/jwt-auth.guard";
import { AuthService } from "../application/auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller()
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // Internal MVP: register dentro de una org (luego lo protegemos con SUPER_ADMIN)
  @Post("/orgs/:orgId/auth/register")
  register(@Param("orgId") orgId: string, @Body() dto: RegisterDto) {
    return this.service.register({
      orgId,
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
    });
  }

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
