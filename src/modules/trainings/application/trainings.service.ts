import { Injectable } from "@nestjs/common";
import { TrainingsRepo } from "../infrastructure/trainings.repo";

@Injectable()
export class TrainingsService {
    constructor(private readonly repo: TrainingsRepo) { }

    createTraining(input: {
        organizationId: string;
        eventId?: string;
        title: string;
        description?: string;
        location?: string;
        startsAt: Date;
        endsAt: Date;
        mandatory?: boolean;
    }) {
        return this.repo.createTraining(input);
    }

    listTrainings(organizationId: string, eventId?: string) {
        return this.repo.listTrainings({ organizationId, eventId });
    }

    async updateTraining(input: {
        organizationId: string;
        trainingId: string;
        scopedEventId?: string;
        eventId?: string | null;
        title?: string;
        description?: string;
        location?: string;
        startsAt?: Date;
        endsAt?: Date;
        mandatory?: boolean;
    }) {
        if (input.scopedEventId) {
            await this.repo.getTrainingForEventOrThrow(
                input.trainingId,
                input.organizationId,
                input.scopedEventId,
            );
        } else {
            await this.repo.getTrainingOrThrow(input.trainingId, input.organizationId);
        }

        if (input.eventId !== undefined && input.eventId !== null) {
            await this.repo.assertEventInOrg(input.eventId, input.organizationId);
        }

        return this.repo.updateTraining({
            trainingId: input.trainingId,
            eventId: input.eventId,
            title: input.title,
            description: input.description,
            location: input.location,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            mandatory: input.mandatory,
        });
    }

    async addAttendee(input: {
        organizationId: string;
        trainingId: string;
        staffMemberId: string;
    }) {
        await this.repo.getTrainingOrThrow(input.trainingId, input.organizationId);
        return this.repo.addAttendee({
            trainingId: input.trainingId,
            staffMemberId: input.staffMemberId,
        });
    }

    async markAttendance(input: {
        organizationId: string;
        trainingId: string;
        staffMemberId: string;
        attended: boolean;
        notes?: string;
    }) {
        await this.repo.getTrainingOrThrow(input.trainingId, input.organizationId);
        return this.repo.markAttendance({
            trainingId: input.trainingId,
            staffMemberId: input.staffMemberId,
            attended: input.attended,
            notes: input.notes,
        });
    }
}
