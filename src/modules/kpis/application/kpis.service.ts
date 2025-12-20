import { Injectable } from "@nestjs/common";
import { KpisRepo } from "../infrastructure/kpis.repo";

@Injectable()
export class KpisService {
  constructor(private readonly repo: KpisRepo) {}

  async summary(params: { organizationId: string; eventId: string }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);

    const now = new Date();
    const [total, byStatus, overdue, slaBreaches, topProviders] = await Promise.all([
      this.repo.totalCount(params.eventId),
      this.repo.countByStatus(params.eventId),
      this.repo.overdueCount(params.eventId, now),
      this.repo.slaBreachCount(params.eventId, now),
      this.repo.topProvidersOpenWorkOrders(params.eventId, 10),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((x) => [x.status, x._count._all]));

    return {
      eventId: params.eventId,
      totalWorkOrders: total,
      byStatus: statusCounts,
      overdueCount: overdue,
      slaBreachCount: slaBreaches,
      topProvidersOpenWorkOrders: topProviders,
      generatedAt: now.toISOString(),
    };
  }

  async overdue(params: { organizationId: string; eventId: string; limit?: number }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    return this.repo.overdueList(params.eventId, new Date(), params.limit ?? 50);
  }

  async slaBreaches(params: { organizationId: string; eventId: string; limit?: number }) {
    await this.repo.assertEventInOrg(params.eventId, params.organizationId);
    return this.repo.slaBreachList(params.eventId, new Date(), params.limit ?? 50);
  }
}
