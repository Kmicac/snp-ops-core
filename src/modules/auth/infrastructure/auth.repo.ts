import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { OrgRole } from "@prisma/client";

@Injectable()
export class AuthRepo {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { memberships: true },
    });
  }

  createUser(params: { email: string; passwordHash: string; fullName?: string }) {
    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash: params.passwordHash,
        fullName: params.fullName ?? null,
      },
    });
  }

  async addMembership(params: { organizationId: string; userId: string; role: OrgRole }) {
    return this.prisma.orgMembership.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        role: params.role,
      },
    });
  }

  listMemberships(userId: string) {
    return this.prisma.orgMembership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: [{ createdAt: "asc" }],
    });
  }
}
