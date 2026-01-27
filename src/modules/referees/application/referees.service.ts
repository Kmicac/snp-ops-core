import { Injectable } from "@nestjs/common";
import { RefereesRepo } from "../infrastructure/referees.repo";

@Injectable()
export class RefereesService {
    constructor(private readonly repo: RefereesRepo) { }

    // perfiles de árbitros

    createOrUpdateProfile(input: {
        staffMemberId: string;
        level?: string;
        isHeadReferee?: boolean;
        notes?: string;
    }) {
        return this.repo.createOrUpdateRefereeProfile(input);
    }

    listRefereesForOrg(organizationId: string) {
        return this.repo.listRefereesByOrganization(organizationId);
    }

    // tatamis

    createTatami(eventId: string, input: { name: string; order?: number; notes?: string }) {
        return this.repo.createTatami({
            eventId,
            name: input.name,
            order: input.order,
            notes: input.notes,
        });
    }

    listTatamisWithReferees(eventId: string) {
        return this.repo.listTatamisWithReferees(eventId);
    }

    async assignRefereeToTatami(input: {
        tatamiId: string;
        staffMemberId: string;
        role: string;
    }) {
        await this.repo.getTatamiOrThrow(input.tatamiId);
        return this.repo.assignRefereeToTatami(input);
    }
}
