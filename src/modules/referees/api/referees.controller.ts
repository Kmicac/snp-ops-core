import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from "@nestjs/common";
import { RefereesService } from "../application/referees.service";
import { CreateRefereeProfileDto } from "./dto/create-referee-profile.dto";
import { CreateTatamiDto } from "./dto/create-tatami.dto";
import { Roles } from "../../auth/security/roles.decorator";
import { OrgRole } from "@prisma/client";
import { AssignRefereeDto } from "./dto/assign-referee.dto";

@Controller()
export class RefereesController {
    constructor(private readonly service: RefereesService) { }


    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Post("orgs/:orgId/referees/profiles")
    createOrUpdateProfile(
        @Param("orgId") orgId: string,
        @Body() dto: CreateRefereeProfileDto,
    ) {
        // orgId se usa en los queries por staffMember.organizationId, no acá directo
        return this.service.createOrUpdateProfile({
            staffMemberId: dto.staffMemberId,
            level: dto.level,
            isHeadReferee: dto.isHeadReferee,
            notes: dto.notes,
        });
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Get("orgs/:orgId/referees")
    listReferees(@Param("orgId") orgId: string) {
        return this.service.listRefereesForOrg(orgId);
    }


    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Post("orgs/:orgId/events/:eventId/tatamis")
    createTatami(
        @Param("eventId") eventId: string,
        @Body() dto: CreateTatamiDto,
    ) {
        return this.service.createTatami(eventId, dto);
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Get("orgs/:orgId/events/:eventId/tatamis")
    listTatamis(
        @Param("eventId") eventId: string,
    ) {
        return this.service.listTatamisWithReferees(eventId);
    }

    @Roles(
        OrgRole.SUPER_ADMIN,
        OrgRole.EVENT_DIRECTOR,
        OrgRole.HEAD_REFEREE,
        OrgRole.TECH_SYSTEMS,
        OrgRole.GUADA,
    )
    @Post("orgs/:orgId/events/:eventId/tatamis/:tatamiId/referees")
    assignReferee(
        @Param("tatamiId") tatamiId: string,
        @Body() dto: AssignRefereeDto,
    ) {
        return this.service.assignRefereeToTatami({
            tatamiId,
            staffMemberId: dto.staffMemberId,
            role: dto.role,
        });
    }
}
