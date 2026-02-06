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

    async updateProfile(organizationId: string, profileId: string, input: {
        level?: string | null;
        isHeadReferee?: boolean;
        notes?: string | null;
    }) {
        await this.repo.getProfileOrThrow(profileId, organizationId);

        const patch: Record<string, any> = {};
        if (input.level !== undefined) patch.level = input.level ?? null;
        if (input.isHeadReferee !== undefined) patch.isHeadReferee = input.isHeadReferee;
        if (input.notes !== undefined) patch.notes = input.notes ?? null;

        return this.repo.updateProfile(profileId, patch);
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

    async updateTatamiAssignment(input: {
        organizationId: string;
        eventId: string;
        tatamiId: string;
        staffMemberId: string;
        role: string;
    }) {
        await this.repo.getTatamiInEventOrThrow(input.tatamiId, input.eventId, input.organizationId);
        await this.repo.assertStaffMemberInOrg(input.staffMemberId, input.organizationId);

        return this.repo.updateTatamiAssignment({
            tatamiId: input.tatamiId,
            staffMemberId: input.staffMemberId,
            role: input.role,
        });
    }
}
