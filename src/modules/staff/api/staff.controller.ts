import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { StaffService } from "../application/staff.service";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { ScanDto } from "./dto/scan.dto";

@Controller()
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Post("/orgs/:orgId/staff")
  createStaff(@Param("orgId") orgId: string, @Body() dto: CreateStaffDto) {
    return this.service.createStaff(orgId, dto);
  }

  @Get("/orgs/:orgId/staff")
  listStaff(@Param("orgId") orgId: string) {
    return this.service.listStaff(orgId);
  }

  @Post("/orgs/:orgId/events/:eventId/shifts")
  createShift(@Param("orgId") orgId: string, @Param("eventId") eventId: string, @Body() dto: CreateShiftDto) {
    return this.service.createShift(orgId, eventId, dto);
  }

  @Get("/orgs/:orgId/events/:eventId/shifts")
  listShifts(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listShifts(orgId, eventId);
  }

  @Post("/orgs/:orgId/events/:eventId/staff/:staffId/assignments")
  assignStaff(
    @Param("orgId") orgId: string,
    @Param("eventId") eventId: string,
    @Param("staffId") staffId: string,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.service.assignStaff(orgId, eventId, staffId, dto);
  }

  @Get("/orgs/:orgId/events/:eventId/assignments")
  listAssignments(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listAssignments(orgId, eventId);
  }

  @Post("/orgs/:orgId/events/:eventId/staff/:staffId/credentials")
  issueCredential(@Param("orgId") orgId: string, @Param("eventId") eventId: string, @Param("staffId") staffId: string) {
    return this.service.issueCredential(orgId, eventId, staffId);
  }

  @Get("/orgs/:orgId/events/:eventId/credentials")
  listCredentials(@Param("orgId") orgId: string, @Param("eventId") eventId: string) {
    return this.service.listCredentials(orgId, eventId);
  }

  @Post("/orgs/:orgId/events/:eventId/scan")
  scan(@Param("orgId") orgId: string, @Param("eventId") eventId: string, @Body() dto: ScanDto) {
    return this.service.scan(orgId, eventId, dto);
  }
}
