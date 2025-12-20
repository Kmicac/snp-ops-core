import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class KpisRepo {
  constructor(private readonly prisma: PrismaService) {}

  async assertEventInOrg(eventId: string, organizationId: string) {
    await this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
  }

  // Conteo por status
  countByStatus(eventId: string) {
    return this.prisma.workOrder.groupBy({
      by: ["status"],
      where: { eventId },
      _count: { _all: true },
    });
  }

  // Total
  totalCount(eventId: string) {
    return this.prisma.workOrder.count({ where: { eventId } });
  }

  // Overdue: scheduledEndAt < now AND status no final
  overdueCount(eventId: string, now: Date) {
    return this.prisma.workOrder.count({
      where: {
        eventId,
        scheduledEndAt: { lt: now },
        status: { in: ["SCHEDULED", "ACCEPTED", "IN_PROGRESS", "DELAYED"] },
      },
    });
  }

  overdueList(eventId: string, now: Date, limit = 50) {
    return this.prisma.workOrder.findMany({
      where: {
        eventId,
        scheduledEndAt: { lt: now },
        status: { in: ["SCHEDULED", "ACCEPTED", "IN_PROGRESS", "DELAYED"] },
      },
      orderBy: [{ scheduledEndAt: "asc" }],
      take: limit,
      include: {
        providerService: { include: { provider: true } },
        zone: true,
      },
    });
  }

  /**
   * SLA breach:
   * - Si hay slaMinutes y scheduledStartAt:
   *   - completada tarde: completedAt > scheduledStartAt + slaMinutes
   *   - o no completada: now > scheduledStartAt + slaMinutes
   *
   * Esto es más fácil/rápido con SQL (join + interval).
   */
  async slaBreachCount(eventId: string, now: Date) {
    const rows = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "WorkOrder" wo
      JOIN "ProviderService" ps ON ps.id = wo."providerServiceId"
      WHERE wo."eventId" = ${eventId}
        AND ps."slaMinutes" IS NOT NULL
        AND wo."scheduledStartAt" IS NOT NULL
        AND (
          (wo."completedAt" IS NOT NULL AND wo."completedAt" > wo."scheduledStartAt" + (ps."slaMinutes" || ' minutes')::interval)
          OR
          (wo."completedAt" IS NULL AND ${now} > wo."scheduledStartAt" + (ps."slaMinutes" || ' minutes')::interval)
        );
    `;
    return Number(rows?.[0]?.count ?? 0);
  }

  async slaBreachList(eventId: string, now: Date, limit = 50) {
    // primero traemos IDs por SQL, luego fetch con Prisma include (limpio para UI)
    const ids = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT wo.id
      FROM "WorkOrder" wo
      JOIN "ProviderService" ps ON ps.id = wo."providerServiceId"
      WHERE wo."eventId" = ${eventId}
        AND ps."slaMinutes" IS NOT NULL
        AND wo."scheduledStartAt" IS NOT NULL
        AND (
          (wo."completedAt" IS NOT NULL AND wo."completedAt" > wo."scheduledStartAt" + (ps."slaMinutes" || ' minutes')::interval)
          OR
          (wo."completedAt" IS NULL AND ${now} > wo."scheduledStartAt" + (ps."slaMinutes" || ' minutes')::interval)
        )
      ORDER BY wo."updatedAt" DESC
      LIMIT ${limit};
    `;

    const idList = ids.map((r) => r.id);
    if (idList.length === 0) return [];

    return this.prisma.workOrder.findMany({
      where: { id: { in: idList } },
      include: {
        providerService: { include: { provider: true } },
        zone: true,
      },
      orderBy: [{ updatedAt: "desc" }],
    });
  }

  async topProvidersOpenWorkOrders(eventId: string, limit = 10) {
    const rows = await this.prisma.$queryRaw<
      { providerId: string; providerName: string; openCount: bigint }[]
    >`
      SELECT p.id AS "providerId", p.name AS "providerName", COUNT(*)::bigint AS "openCount"
      FROM "WorkOrder" wo
      JOIN "ProviderService" ps ON ps.id = wo."providerServiceId"
      JOIN "Provider" p ON p.id = ps."providerId"
      WHERE wo."eventId" = ${eventId}
        AND wo.status IN ('SCHEDULED','ACCEPTED','IN_PROGRESS','DELAYED')
      GROUP BY p.id, p.name
      ORDER BY COUNT(*) DESC
      LIMIT ${limit};
    `;

    return rows.map((r) => ({
      providerId: r.providerId,
      providerName: r.providerName,
      openCount: Number(r.openCount),
    }));
  }
}
