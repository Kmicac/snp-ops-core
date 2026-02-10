export type EventStatusDto = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

export type EventResponseDto = {
  id: string;
  orgId: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venue: string | null;
  venueId: string | null;
  status: EventStatusDto;
  imageUrl: string | null;
  imageKey: string | null;
  workOrdersCount: number;
  incidentsCount: number;
  sponsorsCount: number;
  staffAssignedCount: number;
  assetsAssignedCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EventResourcesResponseDto = {
  staffIds: string[];
  assetIds: string[];
};
