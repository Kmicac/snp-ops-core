import { Injectable, BadRequestException } from "@nestjs/common";
import { StaffRepo } from "../infrastructure/staff.repo";
import { generateQrToken } from "../domain/qr-token";

@Injectable()
export class StaffService {
  constructor(private readonly repo: StaffRepo) {}

  createStaff(orgId: string, dto: any) {
    return this.repo.createStaff(orgId, {
      fullName: dto.fullName.trim(),
      documentId: dto.documentId?.trim() ?? null,
      phone: dto.phone?.trim() ?? null,
      email: dto.email?.trim().toLowerCase() ?? null,
      notes: dto.notes?.trim() ?? null,
    });
  }

  listStaff(orgId: string) {
    return this.repo.listStaff(orgId);
  }

  async createShift(orgId: string, eventId: string, dto: any) {
    await this.repo.assertEventInOrg(eventId, orgId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException("Shift endsAt must be after startsAt");
    return this.repo.createShift(eventId, dto.name.trim(), startsAt, endsAt);
  }

  async listShifts(orgId: string, eventId: string) {
    await this.repo.assertEventInOrg(eventId, orgId);
    return this.repo.listShifts(eventId);
  }

  async assignStaff(orgId: string, eventId: string, staffId: string, dto: any) {
    await this.repo.assertEventInOrg(eventId, orgId);
    await this.repo.getStaffOrThrow(staffId, orgId);

    return this.repo.createAssignment({
      eventId,
      staffMemberId: staffId,
      role: dto.role,
      zoneId: dto.zoneId ?? null,
      shiftId: dto.shiftId ?? null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
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

    // En MVP devolvemos el token para generar QR en frontend
    return { ...cred, qrToken: token };
  }

  async listCredentials(orgId: string, eventId: string) {
    await this.repo.assertEventInOrg(eventId, orgId);
    return this.repo.listCredentials(eventId);
  }

  async scan(orgId: string, eventId: string, dto: any) {
    await this.repo.assertEventInOrg(eventId, orgId);

    const cred = await this.repo.findCredentialByToken(eventId, dto.qrToken);
    const now = new Date();

    if (!cred) {
      await this.repo.logScan({ eventId, credentialId: null, zoneId: dto.zoneId ?? null, result: "DENY", reason: "INVALID_TOKEN" });
      throw new BadRequestException("Invalid QR");
    }

    if (cred.status !== "ACTIVE") {
      await this.repo.logScan({ eventId, credentialId: cred.id, zoneId: dto.zoneId ?? null, result: "DENY", reason: "REVOKED" });
      return { allow: false, reason: "REVOKED", staff: cred.staffMember };
    }

    await this.repo.logScan({ eventId, credentialId: cred.id, zoneId: dto.zoneId ?? null, result: "ALLOW", reason: null });
    return { allow: true, staff: cred.staffMember };
  }
}
