import { Injectable } from "@nestjs/common";
import { InventoryMovementType } from "@prisma/client";
import { InventoryRepo } from "../infrastructure/inventory.repo";

type ZipEntry = {
  name: string;
  data: Buffer;
};

@Injectable()
export class InventoryReportsService {
  constructor(private readonly repo: InventoryRepo) {}
  private static readonly MAX_MOVEMENT_EXPORT_ROWS = 10_000;

  private readonly crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i += 1) {
      let crc = i;
      for (let j = 0; j < 8; j += 1) {
        crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
      }
      table[i] = crc >>> 0;
    }
    return table;
  })();

  private crc32(data: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i += 1) {
      crc = (crc >>> 8) ^ this.crcTable[(crc ^ data[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  private zip(entries: ZipEntry[]): Buffer {
    const localFiles: Buffer[] = [];
    const centralDirs: Buffer[] = [];

    let offset = 0;

    for (const entry of entries) {
      const nameBuffer = Buffer.from(entry.name, "utf8");
      const data = entry.data;
      const crc = this.crc32(data);

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0, 6);
      localHeader.writeUInt16LE(0, 8);
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(0, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(data.length, 18);
      localHeader.writeUInt32LE(data.length, 22);
      localHeader.writeUInt16LE(nameBuffer.length, 26);
      localHeader.writeUInt16LE(0, 28);

      const localFile = Buffer.concat([localHeader, nameBuffer, data]);
      localFiles.push(localFile);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0, 8);
      centralHeader.writeUInt16LE(0, 10);
      centralHeader.writeUInt16LE(0, 12);
      centralHeader.writeUInt16LE(0, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(data.length, 20);
      centralHeader.writeUInt32LE(data.length, 24);
      centralHeader.writeUInt16LE(nameBuffer.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      const central = Buffer.concat([centralHeader, nameBuffer]);
      centralDirs.push(central);

      offset += localFile.length;
    }

    const centralSize = centralDirs.reduce((sum, entry) => sum + entry.length, 0);
    const centralOffset = localFiles.reduce((sum, entry) => sum + entry.length, 0);

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(centralOffset, 16);
    end.writeUInt16LE(0, 20);

    return Buffer.concat([...localFiles, ...centralDirs, end]);
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  private columnRef(index: number): string {
    let n = index + 1;
    let result = "";

    while (n > 0) {
      const rem = (n - 1) % 26;
      result = String.fromCharCode(65 + rem) + result;
      n = Math.floor((n - 1) / 26);
    }

    return result;
  }

  private buildXlsx(rows: Array<Array<string | number>>): Buffer {
    const sheetRows = rows
      .map((row, rowIndex) => {
        const cells = row
          .map((value, colIndex) => {
            const ref = `${this.columnRef(colIndex)}${rowIndex + 1}`;

            if (typeof value === "number") {
              return `<c r="${ref}"><v>${value}</v></c>`;
            }

            const text = this.escapeXml(String(value));
            return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
          })
          .join("");

        return `<row r="${rowIndex + 1}">${cells}</row>`;
      })
      .join("");

    const worksheet = Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`,
      "utf8",
    );

    const workbook = Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Movements" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`,
      "utf8",
    );

    const workbookRels = Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`,
      "utf8",
    );

    const rels = Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
      "utf8",
    );

    const contentTypes = Buffer.from(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`,
      "utf8",
    );

    return this.zip([
      { name: "[Content_Types].xml", data: contentTypes },
      { name: "_rels/.rels", data: rels },
      { name: "xl/workbook.xml", data: workbook },
      { name: "xl/_rels/workbook.xml.rels", data: workbookRels },
      { name: "xl/worksheets/sheet1.xml", data: worksheet },
    ]);
  }

  private toPdfSafeText(value: string): string {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  private buildSimplePdf(lines: string[]): Buffer {
    // PDF simple de una pagina para checklist; intencionalmente acotado para evitar desbordes.
    const pageHeight = 842;
    const startY = 800;
    const lineHeight = 14;

    const truncated = lines.slice(0, 48);

    const textCommands = truncated
      .map((line, index) => {
        const y = startY - index * lineHeight;
        return `BT /F1 10 Tf 40 ${y} Td (${this.toPdfSafeText(line)}) Tj ET`;
      })
      .join("\n");

    const contentStream = `${textCommands}\n`;

    const objects: string[] = [];
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    objects.push(
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 ${pageHeight}] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>\nendobj\n`,
    );
    objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
    objects.push(
      `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}endstream\nendobj\n`,
    );

    let output = "%PDF-1.4\n";
    const offsets: number[] = [0];

    for (const obj of objects) {
      offsets.push(Buffer.byteLength(output, "utf8"));
      output += obj;
    }

    const xrefPos = Buffer.byteLength(output, "utf8");
    output += `xref\n0 ${objects.length + 1}\n`;
    output += "0000000000 65535 f \n";

    for (let i = 1; i <= objects.length; i += 1) {
      output += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

    return Buffer.from(output, "utf8");
  }

  async exportMovementsExcel(params: {
    organizationId: string;
    assetId?: string;
    eventId?: string;
    movementType?: InventoryMovementType;
    from?: Date;
    to?: Date;
  }): Promise<Buffer> {
    const { data } = await this.repo.listMovements({
      organizationId: params.organizationId,
      assetId: params.assetId,
      eventId: params.eventId,
      movementType: params.movementType,
      from: params.from,
      to: params.to,
      limit: InventoryReportsService.MAX_MOVEMENT_EXPORT_ROWS,
      offset: 0,
    });

    const users = await this.repo.listUsersByIds(
      [...new Set(data.map((row) => row.performedByUserId).filter(Boolean))] as string[],
    );
    const usersById = new Map(
      users.map((user) => [user.id, user.fullName ?? user.email]),
    );

    const rows: Array<Array<string | number>> = [
      [
        "Fecha/hora",
        "Tipo",
        "Asset",
        "Evento",
        "Cantidad",
        "Realizado por",
        "Notas",
      ],
      ...data.map((row) => [
        row.checkoutAt.toISOString(),
        row.movementType,
        row.assetName,
        row.eventName ?? row.event?.name ?? "",
        row.quantity,
        row.performedByUserId
          ? (usersById.get(row.performedByUserId) ?? row.performedByUserId)
          : "",
        row.notes ?? "",
      ]),
    ];

    return this.buildXlsx(rows);
  }

  async exportChecklistPdf(params: {
    organizationId: string;
    checklistId: string;
  }): Promise<Buffer> {
    const checklist = await this.repo.getChecklistOrThrow({
      organizationId: params.organizationId,
      checklistId: params.checklistId,
    });

    const progress =
      checklist.totalItems > 0
        ? Math.round((checklist.verifiedItems / checklist.totalItems) * 100)
        : 0;

    const lines: string[] = [
      `Checklist ${checklist.checklistNumber}`,
      `Evento: ${checklist.event.name}`,
      `Tipo: ${checklist.checklistType}`,
      `Responsable: ${checklist.responsibleName ?? "-"}`,
      `Status: ${checklist.status}`,
      `Creado: ${checklist.createdAt.toISOString()}`,
      `Actualizado: ${checklist.updatedAt.toISOString()}`,
      `Progreso: ${progress}%`,
      "",
      "Items",
      "Asset | Codigo/Tag | Esperado | Verificado | Condicion | Notas",
    ];

    for (const item of checklist.items) {
      lines.push(
        `${item.assetName} | ${item.assetCodeOrTag} | ${item.quantityExpected} | ${item.quantityVerified} | ${item.condition} | ${item.notes ?? ""}`,
      );
    }

    if (checklist.signatureData) {
      lines.push("");
      lines.push(`Firma: presente (base64 length ${checklist.signatureData.length})`);
      lines.push(`Firmado por: ${checklist.signedBy ?? "-"}`);
      lines.push(`Firmado en: ${checklist.signedAt?.toISOString() ?? "-"}`);
    }

    return this.buildSimplePdf(lines);
  }
}
