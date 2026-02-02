import { Injectable, BadRequestException } from "@nestjs/common";
import { AuditActionType, AuditEntityType } from "@prisma/client";
import { StaffRepo } from "../infrastructure/staff.repo";
import { generateQrToken } from "../domain/qr-token";
import { AuditService } from "src/modules/audit/application/audit.service";

@Injectable()
export class StaffService {
  constructor(
    private readonly repo: StaffRepo,
    private readonly audit: AuditService,
  ) { }

  async createStaff(orgId: string, dto: any) {
    const staff = await this.repo.createStaff(orgId, {
      fullName: dto.fullName.trim(),
      documentId: dto.documentId?.trim() ?? null,
      phone: dto.phone?.trim() ?? null,
      email: dto.email?.trim().toLowerCase() ?? null,
      notes: dto.notes?.trim() ?? null,
    });

    await this.audit.log({
      organizationId: orgId,
      entityType: AuditEntityType.STAFF_MEMBER,
      entityId: staff.id,
      action: AuditActionType.CREATED,
      message: `Staff member created: ${staff.fullName}`,
    });

    return staff;
  }

  listStaff(orgId: string) {
    return this.repo.listStaff(orgId);
  }

  async createShift(orgId: string, eventId: string, dto: any) {
    await this.repo.assertEventInOrg(eventId, orgId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException("Shift endsAt must be after startsAt");
    const shift = await this.repo.createShift(eventId, dto.name.trim(), startsAt, endsAt);

    await this.audit.log({
      organizationId: orgId,
      eventId,
      entityType: AuditEntityType.SHIFT,
      entityId: shift.id,
      action: AuditActionType.CREATED,
      message: `Shift created: ${shift.name}`,
    });

    return shift;
  }

  async listShifts(orgId: string, eventId: string) {
    await this.repo.assertEventInOrg(eventId, orgId);
    return this.repo.listShifts(eventId);
  }

  async assignStaff(orgId: string, eventId: string, staffId: string, dto: any) {
    await this.repo.assertEventInOrg(eventId, orgId);
    await this.repo.getStaffOrThrow(staffId, orgId);

    if (dto.zoneId) {
      await this.repo.assertZoneInEvent(dto.zoneId, eventId);
    }

    if (dto.shiftId) {
      await this.repo.assertShiftInEvent(dto.shiftId, eventId);
    }

    const assignment = await this.repo.createAssignment({
      eventId,
      staffMemberId: staffId,
      role: dto.role,
      zoneId: dto.zoneId ?? null,
      shiftId: dto.shiftId ?? null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });

    await this.audit.log({
      organizationId: orgId,
      eventId,
      entityType: AuditEntityType.STAFF_ASSIGNMENT,
      entityId: assignment.id,
      action: AuditActionType.CREATED,
      message: `Staff assignment created for ${assignment.staffMember.fullName}`,
      changes: { role: assignment.role, zoneId: assignment.zoneId, shiftId: assignment.shiftId },
    });

    return assignment;
  }

  async listAssignments(orgId: string, eventId: string) {
    await this.repo.assertEventInOrg(eventId, orgId);
    return this.repo.listAssignments(eventId);
  }

  async issueCredential(orgId: string, eventId: string, staffId: string) {
    await this.repo.assertEventInOrg(eventId, orgId);
    await this.repo.getStaffOrThrow(staffId, orgId);

    const token = generateQrToken();
    const cred = await this.repo.createCredential(eventId, staffId, token);

    await this.audit.log({
      organizationId: orgId,
      eventId,
      entityType: AuditEntityType.CREDENTIAL,
      entityId: cred.id,
      action: AuditActionType.CREATED,
      message: "Credential issued",
      changes: { staffMemberId: staffId },
    });

    // En MVP devolvemos el token para generar QR en frontend
    return { ...cred, qrToken: token };
  }

  async listCredentials(orgId: string, eventId: string) {
    await this.repo.assertEventInOrg(eventId, orgId);
    return this.repo.listCredentials(eventId);
  }

  async listScanLogs(
    orgId: string,
    eventId: string,
    filters?: { zoneId?: string; result?: string; limit?: number },
  ) {
    await this.repo.assertEventInOrg(eventId, orgId);
    return this.repo.listScanLogs({
      eventId,
      zoneId: filters?.zoneId,
      result: filters?.result,
      limit: filters?.limit,
    });
  }

  async scan(orgId: string, eventId: string, dto: any) {
    await this.repo.assertEventInOrg(eventId, orgId);

    const cred = await this.repo.findCredentialByToken(eventId, dto.qrToken);

    if (!cred) {
      await this.repo.logScan({
        eventId,
        credentialId: null,
        zoneId: dto.zoneId ?? null,
        scannerUserId: null,
        result: "DENY",
        reason: "INVALID_TOKEN",
      });
      throw new BadRequestException("Invalid QR");
    }

    if (cred.status !== "ACTIVE") {
      await this.repo.logScan({
        eventId,
        credentialId: cred.id,
        zoneId: dto.zoneId ?? null,
        scannerUserId: null,
        result: "DENY",
        reason: "REVOKED",
      });
      return { allow: false, reason: "REVOKED", staff: cred.staffMember };
    }

    await this.repo.logScan({
      eventId,
      credentialId: cred.id,
      zoneId: dto.zoneId ?? null,
      scannerUserId: null,
      result: "ALLOW",
      reason: null,
    });

    return { allow: true, staff: cred.staffMember };
  }

  async revokeCredential(orgId: string, eventId: string, credentialId: string) {
    await this.repo.assertEventInOrg(eventId, orgId);

    const cred = await this.repo.revokeCredential(credentialId);

    await this.audit.log({
      organizationId: orgId,
      eventId,
      entityType: AuditEntityType.CREDENTIAL,
      entityId: cred.id,
      action: AuditActionType.STATUS_CHANGED,
      message: "Credential revoked",
      changes: { status: cred.status, revokedAt: cred.revokedAt },
    });

    return cred;
  }

}
