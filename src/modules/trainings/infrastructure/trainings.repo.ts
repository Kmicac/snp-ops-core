import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { Training, TrainingAttendee } from "@prisma/client";

@Injectable()
export class TrainingsRepo {
    constructor(private readonly prisma: PrismaService) { }

    createTraining(params: {
        organizationId: string;
        eventId?: string;
        title: string;
        description?: string;
        location?: string;
        startsAt: Date;
        endsAt: Date;
        mandatory?: boolean;
    }): Promise<Training> {
        const {
            organizationId,
            eventId,
            title,
            description,
            location,
            startsAt,
            endsAt,
            mandatory,
        } = params;

        return this.prisma.training.create({
            data: {
                organizationId,
                eventId,
                title,
                description,
                location,
                startsAt,
                endsAt,
                mandatory: mandatory ?? false,
            },
        });
    }

    listTrainings(params: {
        organizationId: string;
        eventId?: string;
    }): Promise<Training[]> {
        const { organizationId, eventId } = params;
        return this.prisma.training.findMany({
            where: {
                organizationId,
                eventId: eventId ?? undefined,
            },
            orderBy: [{ startsAt: "asc" }],
        });
    }

    async getTrainingOrThrow(trainingId: string, organizationId: string): Promise<Training> {
        const training = await this.prisma.training.findFirst({
            where: { id: trainingId, organizationId },
        });
        if (!training) {
            throw new NotFoundException("Training not found");
        }
        return training;
    }

  async getTrainingForEventOrThrow(trainingId: string, organizationId: string, eventId: string): Promise<Training> {
    const training = await this.prisma.training.findFirst({
      where: { id: trainingId, organizationId, eventId },
    });
    if (!training) {
      throw new NotFoundException("Training not found");
    }
    return training;
  }

  async assertEventInOrg(eventId: string, organizationId: string) {
    await this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
  }

  updateTraining(params: {
    trainingId: string;
    eventId?: string | null;
    title?: string;
    description?: string;
    location?: string;
    startsAt?: Date;
    endsAt?: Date;
    mandatory?: boolean;
  }): Promise<Training> {
    const { trainingId, eventId, title, description, location, startsAt, endsAt, mandatory } = params;

    return this.prisma.training.update({
      where: { id: trainingId },
      data: {
        eventId,
        title,
        description,
        location,
        startsAt,
        endsAt,
        mandatory,
            },
        });
    }

    addAttendee(params: {
        trainingId: string;
        staffMemberId: string;
    }): Promise<TrainingAttendee> {
        const { trainingId, staffMemberId } = params;

        return this.prisma.trainingAttendee.upsert({
            where: {
                trainingId_staffMemberId: {
                    trainingId,
                    staffMemberId,
                },
            },
            update: {},
            create: {
                trainingId,
                staffMemberId,
            },
        });
    }

    markAttendance(params: {
        trainingId: string;
        staffMemberId: string;
        attended: boolean;
        notes?: string;
    }): Promise<TrainingAttendee> {
        const { trainingId, staffMemberId, attended, notes } = params;

        return this.prisma.trainingAttendee.update({
            where: {
                trainingId_staffMemberId: {
                    trainingId,
                    staffMemberId,
                },
            },
            data: {
                attended,
                notes,
            },
        });
    }
}
