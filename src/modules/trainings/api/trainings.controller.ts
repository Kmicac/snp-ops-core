import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    BadRequestException,
} from "@nestjs/common";
import { TrainingsService } from "../application/trainings.service";
import { CreateTrainingDto } from "./dto/create-training.dto";
import { AddAttendeeDto } from "./dto/add-attendee.dto";
import { MarkAttendanceDto } from "./dto/mark-attendance.dto";
import { UpdateTrainingDto } from "./dto/update-training.dto";
import { Roles } from "../../auth/security/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller()
export class TrainingsController {
    constructor(private readonly service: TrainingsService) { }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.HR,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Post("orgs/:orgId/trainings")
    createTraining(
        @Param("orgId") orgId: string,
        @Body() dto: CreateTrainingDto,
    ) {
        return this.service.createTraining({
            organizationId: orgId,
            title: dto.title,
            description: dto.description,
            location: dto.location,
            startsAt: new Date(dto.startsAt),
            endsAt: new Date(dto.endsAt),
            mandatory: dto.mandatory,
        });
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.HR,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Patch("orgs/:orgId/events/:eventId/trainings/:trainingId")
    updateTraining(
        @Param("orgId") orgId: string,
        @Param("eventId") eventId: string,
        @Param("trainingId") trainingId: string,
        @Body() dto: UpdateTrainingDto,
    ) {
        if (dto.eventId && dto.eventId !== eventId) {
            throw new BadRequestException("eventId in body must match route param");
        }
        return this.service.updateTraining({
            organizationId: orgId,
            eventId,
            trainingId,
            title: dto.title,
            description: dto.description,
            location: dto.location,
            startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
            endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
            mandatory: dto.mandatory,
        });
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.HR,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Get("orgs/:orgId/trainings")
    listTrainingsOrg(
        @Param("orgId") orgId: string,
    ) {
        return this.service.listTrainings(orgId);
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.HR,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Get("orgs/:orgId/events/:eventId/trainings")
    listTrainingsForEvent(
        @Param("orgId") orgId: string,
        @Param("eventId") eventId: string,
    ) {
        return this.service.listTrainings(orgId, eventId);
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.HR,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Post("orgs/:orgId/trainings/:trainingId/attendees")
    addAttendee(
        @Param("orgId") orgId: string,
        @Param("trainingId") trainingId: string,
        @Body() dto: AddAttendeeDto,
    ) {
        return this.service.addAttendee({
            organizationId: orgId,
            trainingId,
            staffMemberId: dto.staffMemberId,
        });
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.HR,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Post("orgs/:orgId/trainings/:trainingId/attendees/:staffMemberId/attendance")
    markAttendance(
        @Param("orgId") orgId: string,
        @Param("trainingId") trainingId: string,
        @Param("staffMemberId") staffMemberId: string,
        @Body() dto: MarkAttendanceDto,
    ) {
        return this.service.markAttendance({
            organizationId: orgId,
            trainingId,
            staffMemberId,
            attended: dto.attended,
            notes: dto.notes,
        });
    }
}
