import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { StaffService } from "../application/staff.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { ScanDto } from "./dto/scan.dto";
import { Roles } from "src/modules/auth/security/roles.decorator";
import { OrgRole } from "@prisma/client";

@Controller()
export class StaffController {
  constructor(private readonly service: StaffService) { }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/staff")
  createStaff(@Param("orgId") orgId: string, @Body() dto: CreateStaffDto) {
    return this.service.createStaff(orgId, dto);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/staff")
  listStaff(@Param("orgId") orgId: string) {
    return this.service.listStaff(orgId);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/events/:eventId/shifts")
  createShift(@Param("orgId") orgId: string, @Param("eventId") eventId: string, @Body() dto: CreateShiftDto) {
    return this.service.createShift(orgId, eventId, dto);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/shifts")
  listShifts(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listShifts(orgId, eventId);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/events/:eventId/staff/:staffId/assignments")
  assignStaff(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("staffId") staffId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.service.assignStaff(orgId, eventId, staffId, dto);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.HEAD_REFEREE,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/assignments")
  listAssignments(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listAssignments(orgId, eventId);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/events/:eventId/staff/:staffId/credentials")
  issueCredential(@Param("orgId") orgId: string, @Param("eventId") eventId: string, @Param("staffId") staffId: string) {
    return this.service.issueCredential(orgId, eventId, staffId);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Get("/orgs/:orgId/events/:eventId/credentials")
  listCredentials(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listCredentials(orgId, eventId);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/events/:eventId/scan")
  scan(@Param("orgId") orgId: string, @Param("eventId") eventId: string, @Body() dto: ScanDto) {
    return this.service.scan(orgId, eventId, dto);
  }

  @Roles(
    OrgRole.SUPER_ADMIN,
    OrgRole.HR,
    OrgRole.EVENT_DIRECTOR,
    OrgRole.TECH_SYSTEMS,
    OrgRole.GUADA,
  )
  @Post("/orgs/:orgId/events/:eventId/credentials/:credentialId/revoke")
  revokeCredential(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("credentialId") credentialId: string,
  ) {
    return this.service.revokeCredential(orgId, eventId, credentialId);
  }
}
