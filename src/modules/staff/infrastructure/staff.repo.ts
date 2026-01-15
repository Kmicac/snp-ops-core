import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class StaffRepo {
  constructor(private readonly prisma: PrismaService) {}

  assertEventInOrg(eventId: string, organizationId: string) {
    return this.prisma.event.findFirstOrThrow({
      where: { id: eventId, organizationId },
      select: { id: true },
    });
  }

  createStaff(organizationId: string, data: any) {
    return this.prisma.staffMember.create({
      data: { organizationId, ...data },
    });
  }

  listStaff(organizationId: string) {
    return this.prisma.staffMember.findMany({
      where: { organizationId },
      orderBy: [{ fullName: "asc" }],
    });
  }

  getStaffOrThrow(staffId: string, organizationId: string) {
    return this.prisma.staffMember.findFirstOrThrow({
      where: { id: staffId, organizationId },
    });
  }

  createShift(eventId: string, name: string, startsAt: Date, endsAt: Date) {
    return this.prisma.shift.create({ data: { eventId, name, startsAt, endsAt } });
  }

  listShifts(eventId: string) {
    return this.prisma.shift.findMany({
      where: { eventId },
      orderBy: [{ startsAt: "asc" }],
    });
  }

  createAssignment(data: any) {
    return this.prisma.staffAssignment.create({
      data,
      include: { staffMember: true, zone: true, shift: true },
    });
  }

  listAssignments(eventId: string) {
    return this.prisma.staffAssignment.findMany({
      where: { eventId },
      include: { staffMember: true, zone: true, shift: true },
      orderBy: [{ createdAt: "desc" }],
    });
  }

  createCredential(eventId: string, staffMemberId: string, qrToken: string) {
    return this.prisma.credential.create({
      data: { eventId, staffMemberId, qrToken },
    });
  }

  findCredentialByToken(eventId: string, qrToken: string) {
    return this.prisma.credential.findFirst({
      where: { eventId, qrToken },
      include: { staffMember: true },
    });
  }

  logScan(data: any) {
    return this.prisma.scanLog.create({ data });
  }

  listCredentials(eventId: string) {
    return this.prisma.credential.findMany({
      where: { eventId },
      include: { staffMember: true },
      orderBy: [{ issuedAt: "desc" }],
    });
  }
}
