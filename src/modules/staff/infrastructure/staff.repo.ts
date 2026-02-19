import { Injectable } from "@nestjs/common";
import { Credential, Shift, StaffMember } from "@prisma/client";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class StaffRepo {
  constructor(private readonly prisma: PrismaService) { }

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

  findByIdAndOrganizationId(staffId: string, organizationId: string) {
    return this.prisma.staffMember.findFirst({
      where: { id: staffId, organizationId },
    });
  }

  updateStaffMember(staffId: string, data: Partial<StaffMember>) {
    return this.prisma.staffMember.update({
      where: { id: staffId },
      data,
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

  getShiftOrThrow(shiftId: string) {
    return this.prisma.shift.findUniqueOrThrow({
      where: { id: shiftId },
    });
  }

  updateShift(shiftId: string, data: Partial<Shift>) {
    return this.prisma.shift.update({
      where: { id: shiftId },
      data,
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

  logScan(data: {
    eventId: string;
    credentialId: string | null;
    zoneId?: string | null;
    scannerUserId?: string | null;
    result: string;
    reason?: string | null;
  }) {
    return this.prisma.scanLog.create({ data });
  }

  listCredentials(eventId: string) {
    return this.prisma.credential.findMany({
      where: { eventId },
      include: { staffMember: true },
      orderBy: [{ issuedAt: "desc" }],
    });
  }

  getCredentialInEventOrThrow(credentialId: string, eventId: string) {
    return this.prisma.credential.findFirstOrThrow({
      where: { id: credentialId, eventId },
    });
  }

  updateCredential(credentialId: string, data: Partial<Credential>) {
    return this.prisma.credential.update({
      where: { id: credentialId },
      data,
    });
  }

  listScanLogs(params: {
    eventId: string;
    zoneId?: string;
    result?: string;
    limit?: number;
  }) {
    return this.prisma.scanLog.findMany({
      where: {
        eventId: params.eventId,
        ...(params.zoneId ? { zoneId: params.zoneId } : {}),
        ...(params.result ? { result: params.result } : {}),
      },
      include: {
        credential: { include: { staffMember: true } },
        zone: true,
        scannerUser: true,
      },
      orderBy: [{ scannedAt: "desc" }],
      take: params.limit ?? 100,
    });
  }


  assertZoneInEvent(zoneId: string, eventId: string) {
    return this.prisma.zone.findFirstOrThrow({
      where: { id: zoneId, eventId },
      select: { id: true },
    });
  }

  assertShiftInEvent(shiftId: string, eventId: string) {
    return this.prisma.shift.findFirstOrThrow({
      where: { id: shiftId, eventId },
      select: { id: true },
    });
  }

  revokeCredential(credentialId: string) {
    return this.prisma.credential.update({
      where: { id: credentialId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });
  }
}
