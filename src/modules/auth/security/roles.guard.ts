import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "./roles.decorator";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { OrgRole } from "@prisma/client";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<OrgRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const orgId = req.params?.orgId as string | undefined;
    const userId = req.user?.sub as string | undefined;

    if (!orgId || !userId) throw new ForbiddenException("Missing org scope or user");

    const memberships = await this.prisma.orgMembership.findMany({
      where: { organizationId: orgId, userId },
      select: { role: true },
    });

    const roles = new Set(memberships.map((m) => m.role));
    const ok = required.some((r) => roles.has(r));

    if (!ok) throw new ForbiddenException("Insufficient role");
    return true;
  }
}
