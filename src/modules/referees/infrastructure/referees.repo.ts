import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import {
    RefereeProfile,
    Tatami,
    TatamiReferee,
} from "@prisma/client";

@Injectable()
export class RefereesRepo {
    constructor(private readonly prisma: PrismaService) { }


    async createOrUpdateRefereeProfile(params: {
        staffMemberId: string;
        level?: string;
        isHeadReferee?: boolean;
        notes?: string;
    }): Promise<RefereeProfile> {
        const { staffMemberId, level, isHeadReferee, notes } = params;

        return this.prisma.refereeProfile.upsert({
            where: { staffMemberId },
            update: {
                level,
                isHeadReferee: isHeadReferee ?? false,
                notes,
            },
            create: {
                staffMemberId,
                level,
                isHeadReferee: isHeadReferee ?? false,
                notes,
            },
        });
    }

    async listRefereesByOrganization(organizationId: string) {
        return this.prisma.refereeProfile.findMany({
            where: {
                staffMember: { organizationId },
            },
            include: {
                staffMember: true,
            },
            orderBy: [
                { isHeadReferee: "desc" },
                { level: "desc" },
                { staffMember: { fullName: "asc" } },
            ],
        });
    }


    async createTatami(params: {
        eventId: string;
        name: string;
        order?: number;
        notes?: string;
    }): Promise<Tatami> {
        const { eventId, name, order, notes } = params;
        return this.prisma.tatami.create({
            data: {
                eventId,
                name,
                order: order ?? 0,
                notes,
            },
        });
    }

    async listTatamisWithReferees(eventId: string) {
        return this.prisma.tatami.findMany({
            where: { eventId },
            orderBy: [{ order: "asc" }, { name: "asc" }],
            include: {
                referees: {
                    include: {
                        staffMember: true,
                    },
                },
            },
        });
    }

    async assignRefereeToTatami(params: {
        tatamiId: string;
        staffMemberId: string;
        role: string;
    }): Promise<TatamiReferee> {
        const { tatamiId, staffMemberId, role } = params;

        // upsert para no duplicar si ya existe
        const existing = await this.prisma.tatamiReferee.findFirst({
            where: { tatamiId, staffMemberId },
        });

        if (existing) {
            return this.prisma.tatamiReferee.update({
                where: { id: existing.id },
                data: { role },
            });
        }

        return this.prisma.tatamiReferee.create({
            data: {
                tatamiId,
                staffMemberId,
                role,
            },
        });
    }

    async getTatamiOrThrow(tatamiId: string): Promise<Tatami> {
        const tatami = await this.prisma.tatami.findUnique({
            where: { id: tatamiId },
        });
        if (!tatami) {
            throw new NotFoundException("Tatami not found");
        }
        return tatami;
    }
}
