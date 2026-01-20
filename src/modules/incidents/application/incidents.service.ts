import { IncidentsRepository } from "../infrastructure/incidents.repo";
import { IncidentSeverity, IncidentType } from "../domain/incident.types";

export class IncidentsService {
  constructor(private readonly repo: IncidentsRepository) {}

  createIncident(input: {
    organizationId: string;
    eventId: string;
    type: IncidentType;
    severity: IncidentSeverity;
    title: string;
    description: string;
    createdById: string;
  }) {
    return this.repo.create(input);
  }
}
