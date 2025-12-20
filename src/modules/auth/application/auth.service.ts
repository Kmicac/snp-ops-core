import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { AuthRepo } from "../infrastructure/auth.repo";
import { OrgRole } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(private readonly repo: AuthRepo, private readonly jwt: JwtService) {}

  async register(params: { orgId: string; email: string; password: string; fullName?: string; role?: OrgRole }) {
    const email = params.email.trim().toLowerCase();
    const existing = await this.repo.findUserByEmail(email);
    if (existing) throw new BadRequestException("Email already exists");

    const passwordHash = await bcrypt.hash(params.password, 12);
    const user = await this.repo.createUser({ email, passwordHash, fullName: params.fullName });

    // Por defecto: TECH_SYSTEMS (ajustable)
    await this.repo.addMembership({
      organizationId: params.orgId,
      userId: user.id,
      role: params.role ?? "TECH_SYSTEMS",
    });

    return { id: user.id, email: user.email };
  }

  async login(params: { email: string; password: string }) {
    const email = params.email.trim().toLowerCase();
    const user = await this.repo.findUserByEmail(email);
    if (!user || !user.isActive) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const token = await this.jwt.signAsync(
      { sub: user.id },
      { secret: process.env.JWT_SECRET ?? "dev_secret_change_me", expiresIn: "12h" },
    );

    return { accessToken: token };
  }

  async me(userId: string) {
    const memberships = await this.repo.listMemberships(userId);
    return {
      userId,
      memberships: memberships.map((m) => ({
        orgId: m.organizationId,
        orgName: m.organization.name,
        role: m.role,
      })),
    };
  }
}
